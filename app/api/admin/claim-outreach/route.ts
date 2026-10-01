import { NextResponse } from "next/server";
import { getAllVendors } from "@/lib/vendors";
import { sendOutreachEmail, emailConfigured } from "@/lib/email";
import { isSuppressed, listOutreachSent } from "@/lib/outreach";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// "Claim your listing" outreach to companies already in the directory that have
// a contact email. Uses sendOutreachEmail (from hello@oohsource.com, with
// List-Unsubscribe + unsubscribe link), which records a durable outreach-sent
// marker so no address is ever emailed twice across runs.
//   GET  [?limit=50]          -> dry run: the exact recipient plan.
//   POST ?send=1[&limit=50]   -> actually sends. Auth: x-admin-key.
// Recipients are: listings WITH an email, not already-emailed, not suppressed/
// unsubscribed, de-duped by address, excluding our own brands.

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const DEFAULT_LIMIT = 50;

// Don't email our own portfolio brands "claim your listing".
const SELF_DOMAINS = [
  "oohsource.com",
  "dashtwo.com",
  "wildposting.com",
  "wildposting.mx",
  "streetposter.com",
  "flyposting.com",
  "busbenchads.com",
];

function authed(req: Request): boolean {
  const key = (req.headers.get("x-admin-key") || "").trim();
  const configured = (process.env.ADMIN_KEY || "").trim();
  return Boolean(configured) && key === configured;
}

type Recipient = { name: string; slug: string; email: string };

// Collect up to `limit` ready recipients, plus a breakdown of why others were
// skipped. isSuppressed is only called for otherwise-eligible candidates, so a
// run makes at most ~limit+suppressed network checks, not one per listing.
async function buildPlan(limit: number): Promise<{
  recipients: Recipient[];
  totals: {
    listings: number;
    withEmail: number;
    noEmail: number;
    alreadySent: number;
    duplicate: number;
    self: number;
    suppressed: number;
    ready: number;
  };
}> {
  const vendors = [...(await getAllVendors())].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const sentSet = new Set(
    (await listOutreachSent()).map((e) => e.trim().toLowerCase())
  );

  const recipients: Recipient[] = [];
  const seen = new Set<string>();
  const t = {
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

export async function GET(req: Request) {
  if (!authed(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limit = Math.min(
    200,
    Math.max(1, parseInt(new URL(req.url).searchParams.get("limit") || "", 10) || DEFAULT_LIMIT)
  );
  const { recipients, totals } = await buildPlan(limit);
  return NextResponse.json({
    ok: true,
    mode: "dry-run",
    emailConfigured: emailConfigured(),
    limit,
    totals,
    recipients,
  });
}

export async function POST(req: Request) {
  if (!authed(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  if (url.searchParams.get("send") !== "1") {
    return NextResponse.json(
      { error: "Pass ?send=1 to actually send. Use GET for a dry run." },
      { status: 400 }
    );
  }
  if (!emailConfigured()) {
    return NextResponse.json({ error: "RESEND_API_KEY not set" }, { status: 500 });
  }
  const limit = Math.min(
    200,
    Math.max(1, parseInt(url.searchParams.get("limit") || "", 10) || DEFAULT_LIMIT)
  );

  const { recipients } = await buildPlan(limit);
  const results: (Recipient & { sent: boolean; error?: string })[] = [];
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

  return NextResponse.json({ ok: true, mode: "send", sent, skipped, failed, results });
}
