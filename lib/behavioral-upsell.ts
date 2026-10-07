import { listAllOwners } from "@/lib/owner";
import { getVendorBySlug } from "@/lib/vendors";
import { getStats } from "@/lib/stats";
import { isSuppressed } from "@/lib/outreach";
import { emailConfigured, sendBehavioralNudge } from "@/lib/email";
import { kv } from "@/lib/kv";

// Behavioral Featured upsell: email owners of FREE listings that actually got
// traffic in the last week, leading with their real view/contact numbers. Much
// higher intent than the generic pricing nudge, and it recurs (at most once per
// owner per 30 days) rather than firing once.

const WINDOW_DAYS = 7;
const DEFAULT_MIN_VIEWS = 8;
const DEFAULT_MIN_CONTACTS = 2;
const DEDUP_TTL = 30 * 24 * 3600; // at most one behavioral nudge per owner / 30d

export type BehavioralCandidate = {
  email: string;
  slug: string;
  name: string;
  views: number;
  contacts: number;
};

export type BehavioralRunResult = {
  owners: number;
  eligible: number;
  sent: number;
  skipped: number;
  candidates: BehavioralCandidate[]; // populated on dry runs
  results: { email: string; slug?: string; sent?: boolean; skipped?: string; error?: string }[];
};

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

// For one owner, find their best FREE listing that cleared the activity bar in
// the last WINDOW_DAYS. Returns null if none qualify.
async function bestActiveFreeListing(
  email: string,
  slugs: string[],
  minViews: number,
  minContacts: number
): Promise<BehavioralCandidate | null> {
  let best: BehavioralCandidate | null = null;
  for (const slug of slugs) {
    const vendor = await getVendorBySlug(slug);
    if (!vendor || vendor.tier === "Featured") continue; // only nudge free listings
    const stats = await getStats(slug, WINDOW_DAYS);
    const views = sum(stats.series.view);
    const contacts = sum(stats.series.website) + sum(stats.series.email);
    if (views < minViews && contacts < minContacts) continue; // not enough activity
    const cand: BehavioralCandidate = { email, slug, name: vendor.name, views, contacts };
    if (!best || views > best.views || (views === best.views && contacts > best.contacts)) {
      best = cand;
    }
  }
  return best;
}

export async function runBehavioralUpsell(
  opts: {
    dry?: boolean;
    onlyEmail?: string;
    minViews?: number;
    minContacts?: number;
  } = {}
): Promise<BehavioralRunResult> {
  const minViews = opts.minViews ?? DEFAULT_MIN_VIEWS;
  const minContacts = opts.minContacts ?? DEFAULT_MIN_CONTACTS;
  const only = opts.onlyEmail?.toLowerCase().trim();

  const owners = await listAllOwners();
  const candidates: BehavioralCandidate[] = [];
  const results: BehavioralRunResult["results"] = [];
  let eligible = 0;
  let sent = 0;
  let skipped = 0;

  const r = kv();

  for (const [email, slugs] of Array.from(owners.entries())) {
    if (only && email !== only) continue;
    const cand = await bestActiveFreeListing(email, slugs, minViews, minContacts);
    if (!cand) continue;
    eligible++;

    if (opts.dry) {
      candidates.push(cand);
      results.push({ email, slug: cand.slug });
      continue;
    }

    // At most one behavioral nudge per owner per 30 days (atomic set-if-absent).
    if (r) {
      const first = await r.set(`behnudge:${email.toLowerCase()}`, "1", {
        nx: true,
        ex: DEDUP_TTL,
      });
      if (!first) {
        skipped++;
        results.push({ email, slug: cand.slug, skipped: "recently-nudged" });
        continue;
      }
    }
    if (!emailConfigured() || (await isSuppressed(email))) {
      skipped++;
      results.push({ email, slug: cand.slug, skipped: "suppressed-or-unconfigured" });
      continue;
    }

    await new Promise((res) => setTimeout(res, 700)); // under Resend's ~2/s limit
    try {
      const ok = await sendBehavioralNudge(email, cand.name, cand.views, cand.contacts);
      if (ok) {
        sent++;
        results.push({ email, slug: cand.slug, sent: true });
      } else {
        skipped++;
        results.push({ email, slug: cand.slug, skipped: "suppressed-at-send" });
      }
    } catch (e) {
      skipped++;
      results.push({ email, slug: cand.slug, error: String(e).slice(0, 150) });
    }
  }

  return { owners: owners.size, eligible, sent, skipped, candidates, results };
}
