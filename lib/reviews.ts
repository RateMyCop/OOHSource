import { kv, kvGetCached } from "./kv";

// Native OOHsource reviews. Stored in KV (Upstash). Writes only ever happen in
// API routes (runtime), so the no-store client is safe there. The PUBLIC profile
// pages are statically generated, so they read a denormalized per-slug snapshot
// (reviews:pub:<slug>) via a CACHED fetch — never the no-store client.

export type ReviewStatus = "pending" | "published" | "rejected";
export type ReviewSource = "direct" | "invited";

export type Review = {
  id: string;
  slug: string;
  name: string;
  company: string;
  email: string; // stored for verification, never shown publicly
  rating: number; // 1–5
  title: string;
  body: string;
  status: ReviewStatus;
  source: ReviewSource;
  created: string; // ISO
  response?: string; // owner reply
};

// What the public profile shows (no email).
export type PublicReview = Omit<Review, "email">;
export type ReviewAggregate = { count: number; average: number };

const idxKey = (slug: string) => `reviews:index:${slug}`;
const pubKey = (slug: string) => `reviews:pub:${slug}`;
const PENDING = "reviews:pending";

function newId(): string {
  return "rv_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function strip(r: Review): PublicReview {
  const { email, ...rest } = r;
  void email;
  return rest;
}

// ---- Writes (runtime only) ----

export async function createReview(input: {
  slug: string;
  name: string;
  company: string;
  email: string;
  rating: number;
  title: string;
  body: string;
  source: ReviewSource;
}): Promise<Review | null> {
  const r = kv();
  if (!r) return null;
  const review: Review = {
    id: newId(),
    slug: input.slug,
    name: input.name,
    company: input.company,
    email: input.email,
    rating: input.rating,
    title: input.title,
    body: input.body,
    status: "pending",
    source: input.source,
    created: new Date().toISOString(),
  };
  await Promise.all([
    r.set(`review:${review.id}`, review),
    r.sadd(idxKey(review.slug), review.id),
    r.sadd(PENDING, review.id),
  ]);
  return review;
}

export async function setReviewStatus(id: string, status: ReviewStatus): Promise<Review | null> {
  const r = kv();
  if (!r) return null;
  const review = (await r.get(`review:${id}`)) as Review | null;
  if (!review) return null;
  review.status = status;
  await r.set(`review:${id}`, review);
  if (status === "pending") await r.sadd(PENDING, id);
  else await r.srem(PENDING, id);
  await rebuildPublished(review.slug);
  return review;
}

export async function respondToReview(id: string, response: string): Promise<Review | null> {
  const r = kv();
  if (!r) return null;
  const review = (await r.get(`review:${id}`)) as Review | null;
  if (!review) return null;
  review.response = response;
  await r.set(`review:${id}`, review);
  await rebuildPublished(review.slug);
  return review;
}

// Rebuild the public snapshot for a slug (published reviews, newest first, no email).
async function rebuildPublished(slug: string): Promise<void> {
  const r = kv();
  if (!r) return;
  const all = await listReviewsForSlug(slug);
  const pub = all
    .filter((x) => x.status === "published")
    .sort((a, b) => (a.created < b.created ? 1 : -1))
    .map(strip);
  await r.set(pubKey(slug), pub);
}

// ---- Reads: dynamic contexts (dashboard/admin) use the client directly ----

export async function getReview(id: string): Promise<Review | null> {
  const r = kv();
  if (!r) return null;
  return ((await r.get(`review:${id}`)) as Review | null) || null;
}

export async function listReviewsForSlug(slug: string): Promise<Review[]> {
  const r = kv();
  if (!r) return [];
  const ids = ((await r.smembers(idxKey(slug))) as string[]) || [];
  if (!ids.length) return [];
  const rows = (await r.mget<(Review | null)[]>(...ids.map((id) => `review:${id}`))) || [];
  return rows.filter((x): x is Review => Boolean(x)).sort((a, b) => (a.created < b.created ? 1 : -1));
}

export async function listPendingReviews(): Promise<Review[]> {
  const r = kv();
  if (!r) return [];
  const ids = ((await r.smembers(PENDING)) as string[]) || [];
  if (!ids.length) return [];
  const rows = (await r.mget<(Review | null)[]>(...ids.map((id) => `review:${id}`))) || [];
  return rows.filter((x): x is Review => Boolean(x)).sort((a, b) => (a.created < b.created ? 1 : -1));
}

// ---- Reads: PUBLIC profile (build-safe, cached fetch) ----

function parsePub(raw: string | null): PublicReview[] {
  if (!raw) return [];
  let val: unknown = raw;
  for (let i = 0; i < 2 && typeof val === "string"; i++) {
    try {
      val = JSON.parse(val);
    } catch {
      return [];
    }
  }
  return Array.isArray(val) ? (val as PublicReview[]) : [];
}

export async function getPublishedReviews(slug: string): Promise<PublicReview[]> {
  return parsePub(await kvGetCached(pubKey(slug), 60));
}

export function aggregate(reviews: { rating: number }[]): ReviewAggregate {
  if (!reviews.length) return { count: 0, average: 0 };
  const sum = reviews.reduce((s, x) => s + (x.rating || 0), 0);
  return { count: reviews.length, average: Math.round((sum / reviews.length) * 10) / 10 };
}
