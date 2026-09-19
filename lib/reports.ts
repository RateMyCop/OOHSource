import { getStats } from "./stats";
import { getVendorBySlug, getVendorsByCategory } from "./vendors";
import { listForCategory, fullRankOfVendor } from "./lists";
import { listReviewsForSlug } from "./reviews";
import { listAllOwners } from "./owner";
import { sendMonthlyReport } from "./email";
import { kv } from "./kv";

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
const pctChange = (cur: number, prev: number) =>
  prev > 0 ? Math.round(((cur - prev) / prev) * 100) : cur > 0 ? 100 : 0;

export type ListingReport = {
  slug: string;
  name: string;
  views: number;
  viewsPrev: number;
  viewsPct: number;
  clicks: number;
  rank: number | null;
  total: number;
  listTitle: string | null;
  rankDelta: number | null; // + = improved (moved up), from last month's snapshot
  newReviews: number;
  pendingReviews: number;
};

// One monthly rank snapshot per slug, so we can show month-over-month movement.
// Returns the delta vs last month's snapshot (positive = moved up), or null.
async function rankMonthOverMonth(slug: string, rank: number, write: boolean): Promise<number | null> {
  const r = kv();
  if (!r) return null;
  const month = new Date().toISOString().slice(0, 7);
  const key = `rank:last:${slug}`;
  const prev = (await r.get(key)) as { month: string; rank: number } | null;
  const delta = prev && prev.month !== month ? prev.rank - rank : null;
  if (write && (!prev || prev.month !== month)) {
    await r.set(key, { month, rank });
  }
  return delta;
}

export async function buildListingReport(
  slug: string,
  writeSnapshot = true
): Promise<ListingReport | null> {
  const vendor = await getVendorBySlug(slug);
  if (!vendor) return null;

  const stats = await getStats(slug, 60);
  const views = sum(stats.series.view.slice(30));
  const viewsPrev = sum(stats.series.view.slice(0, 30));
  const clicks = sum(stats.series.website.slice(30)) + sum(stats.series.email.slice(30));

  let rank: number | null = null;
  let total = 0;
  let listTitle: string | null = null;
  let rankDelta: number | null = null;
  const list = listForCategory(vendor.categorySlug);
  if (list) {
    const fr = fullRankOfVendor(await getVendorsByCategory(vendor.categorySlug), slug);
    if (fr) {
      rank = fr.rank;
      total = fr.total;
      listTitle = list.title;
      rankDelta = await rankMonthOverMonth(slug, fr.rank, writeSnapshot);
    }
  }

  const reviews = await listReviewsForSlug(slug);
  const cutoff = Date.now() - 30 * 86400000;
  const newReviews = reviews.filter(
    (x) => x.status === "published" && Date.parse(x.created) >= cutoff
  ).length;
  const pendingReviews = reviews.filter((x) => x.status === "pending").length;

  return {
    slug,
    name: vendor.name,
    views,
    viewsPrev,
    viewsPct: pctChange(views, viewsPrev),
    clicks,
    rank,
    total,
    listTitle,
    rankDelta,
    newReviews,
    pendingReviews,
  };
}

export type MonthlyRunResult = {
  owners: number;
  sent: number;
  skipped: number;
  results: { email: string; sent?: boolean; error?: string; listings?: ListingReport[] }[];
};

export async function runMonthlyReports(
  opts: { dry?: boolean; onlyEmail?: string } = {}
): Promise<MonthlyRunResult> {
  const owners = await listAllOwners();
  const only = opts.onlyEmail?.toLowerCase().trim();
  const results: MonthlyRunResult["results"] = [];
  let sent = 0;
  let skipped = 0;

  for (const [email, slugs] of Array.from(owners.entries())) {
    if (only && email !== only) continue;
    const listings = (
      await Promise.all(slugs.map((s) => buildListingReport(s, !opts.dry)))
    ).filter((x): x is ListingReport => Boolean(x));
    if (!listings.length) {
      skipped++;
      continue;
    }
    if (opts.dry) {
      results.push({ email, listings });
      continue;
    }
    try {
      const ok = await sendMonthlyReport(email, listings);
      if (ok) sent++;
      else skipped++;
      results.push({ email, sent: ok });
    } catch (e) {
      skipped++;
      results.push({ email, error: String(e).slice(0, 150) });
    }
    await new Promise((r) => setTimeout(r, 700)); // under Resend's ~2/s limit
  }

  return { owners: owners.size, sent, skipped, results };
}
