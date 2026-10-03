import { getAllVendors } from "@/lib/vendors";
import { sendOutreachEmail } from "@/lib/email";
import { isSuppressed, listOutreachSent } from "@/lib/outreach";

// Shared logic for the "claim your listing" outreach, used by both the admin
// endpoint (manual, x-admin-key) and the weekly cron. sendOutreachEmail records
// a durable outreach-sent marker, so no address is ever emailed twice.

export const CLAIM_OUTREACH_DEFAULT_LIMIT = 50;

// Don't email our own portfolio brands.
const SELF_DOMAINS = [
  "oohsource.com",
  "dashtwo.com",
  "wildposting.com",
  "wildposting.mx",
  "streetposter.com",
  "flyposting.com",
  "busbenchads.com",
];

export type ClaimRecipient = { name: string; slug: string; email: string };

export type ClaimTotals = {
  listings: number;
  withEmail: number;
  noEmail: number;
  alreadySent: number;
  duplicate: number;
  self: number;
  suppressed: number;
  ready: number;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Collect up to `limit` ready recipients plus a breakdown of why others were
// skipped. isSuppressed is only checked for otherwise-eligible candidates.
export async function buildClaimPlan(
  limit: number
): Promise<{ recipients: ClaimRecipient[]; totals: ClaimTotals }> {
  const vendors = [...(await getAllVendors())].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const sentSet = new Set(
    (await listOutreachSent()).map((e) => e.trim().toLowerCase())
  );

  const recipients: ClaimRecipient[] = [];
  const seen = new Set<string>();
  const t: ClaimTotals = {
    listings: vendors.length,
    withEmail: 0,
    noEmail: 0,
    alreadySent: 0,
    duplicate: 0,
    self: 0,
    suppressed: 0,
    ready: 0,
  };

  for (const v of vendors) {
    const email = (v.contactEmail || "").trim().toLowerCase();
    if (!email) {
      t.noEmail++;
      continue;
    }
    t.withEmail++;
    if (SELF_DOMAINS.some((d) => email.endsWith("@" + d) || email.endsWith("." + d))) {
      t.self++;
      continue;
    }
    if (seen.has(email)) {
      t.duplicate++;
      continue;
    }
    if (sentSet.has(email)) {
      t.alreadySent++;
      continue;
    }
    if (recipients.length >= limit) continue; // enough ready; keep tallying skips
    if (await isSuppressed(email)) {
      t.suppressed++;
      continue;
    }
    seen.add(email);
    recipients.push({ name: v.name, slug: v.slug, email });
  }
  t.ready = recipients.length;
  return { recipients, totals: t };
}

export async function sendClaimBatch(limit: number): Promise<{
  sent: number;
  skipped: number;
  failed: number;
  results: (ClaimRecipient & { sent: boolean; error?: string })[];
}> {
  const { recipients } = await buildClaimPlan(limit);
  const results: (ClaimRecipient & { sent: boolean; error?: string })[] = [];
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const r of recipients) {
    await sleep(600); // throttle under Resend's ~2 req/s limit
    try {
      const ok = await sendOutreachEmail(r.email, r.name, r.slug);
      if (ok) {
        sent++;
        results.push({ ...r, sent: true });
      } else {
        skipped++;
        results.push({ ...r, sent: false, error: "suppressed-at-send" });
      }
    } catch (e) {
      failed++;
      results.push({ ...r, sent: false, error: String(e).slice(0, 200) });
    }
  }
  return { sent, skipped, failed, results };
}
