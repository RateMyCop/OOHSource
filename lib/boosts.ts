import { kv, kvGetCached } from "@/lib/kv";
import { CATEGORIES } from "@/lib/data";
import { FORMAT_TYPES } from "@/lib/formats";

// Per-page "Boost" product: a listing pays to be pinned to the #1 slot on one
// specific page (a category hub or a format page), above even other Featured
// listings. Boosts are stored in KV as a single JSON doc keyed by page, so the
// public pages can read them with a build-safe CACHED fetch (never no-store).
//
//   oohs:boosts  ->  { "<pageKey>": { "<vendorSlug>": <expiryMs> } }
//
// "Best of" lists are deliberately NOT boostable — those stay merit-ranked so
// the award badges and ranking emails keep their integrity.

const BOOSTS_KEY = "oohs:boosts";

export type BoostMap = Record<string, Record<string, number>>;

export function categoryPageKey(slug: string): string {
  return `category:${slug}`;
}
export function formatPageKey(slug: string): string {
  return `format:${slug}`;
}

// A page a boost can be bought for: kind + the slug + display label + public URL.
export function describePageKey(
  pageKey: string
): { kind: "category" | "format"; slug: string; label: string; url: string } | null {
  const [kind, slug] = pageKey.split(":");
  if (kind === "category") {
    const c = CATEGORIES.find((x) => x.slug === slug);
    if (!c) return null;
    return { kind, slug, label: c.name, url: `/category/${slug}` };
  }
  if (kind === "format") {
    const f = FORMAT_TYPES.find((x) => x.slug === slug);
    if (!f) return null;
    return { kind, slug, label: f.name, url: `/formats/${slug}` };
  }
  return null;
}

// Only real category / format pages are boostable (guards the checkout route).
export function isBoostablePageKey(pageKey: string): boolean {
  return describePageKey(pageKey) !== null;
}

function parseMap(raw: unknown): BoostMap {
  let v: unknown = raw;
  for (let i = 0; i < 2 && typeof v === "string"; i++) {
    try {
      v = JSON.parse(v);
    } catch {
      return {};
    }
  }
  return v && typeof v === "object" ? (v as BoostMap) : {};
}

// Drop expired entries (and emptied pages). Pure — returns a fresh map.
function prune(map: BoostMap, now = Date.now()): BoostMap {
  const out: BoostMap = {};
  for (const [pk, slugs] of Object.entries(map || {})) {
    const kept: Record<string, number> = {};
    for (const [slug, exp] of Object.entries(slugs || {})) {
      if (typeof exp === "number" && exp > now) kept[slug] = exp;
    }
    if (Object.keys(kept).length) out[pk] = kept;
  }
  return out;
}

// Build-safe cached read for public pages (category/format) + the dashboard.
export async function readBoostsCached(revalidate = 60): Promise<BoostMap> {
  const raw = await kvGetCached(BOOSTS_KEY, revalidate);
  if (raw == null) return {};
  return prune(parseMap(raw));
}

// Active (non-expired) boosted slugs for one page, as a Set for O(1) lookup.
export async function boostedSlugsForPage(pageKey: string): Promise<Set<string>> {
  const map = await readBoostsCached();
  return new Set(Object.keys(map[pageKey] || {}));
}

// Every active boost a vendor holds: pageKey -> expiryMs. Powers the dashboard
// ("you already own #1 here" + which pages still have a Boost CTA).
export async function boostsForVendor(slug: string): Promise<Record<string, number>> {
  const map = await readBoostsCached();
  const out: Record<string, number> = {};
  for (const [pk, slugs] of Object.entries(map)) {
    const exp = slugs[slug];
    if (exp) out[pk] = exp;
  }
  return out;
}

// --- Writes (API routes only; use the no-store client) ----------------------

async function readMapLive(): Promise<BoostMap> {
  const r = kv();
  if (!r) return {};
  const raw = await r.get(BOOSTS_KEY);
  return prune(parseMap(raw));
}

export async function activateBoost(
  slug: string,
  pageKey: string,
  untilMs: number
): Promise<void> {
  const r = kv();
  if (!r) return;
  const map = await readMapLive();
  (map[pageKey] ||= {})[slug] = untilMs;
  await r.set(BOOSTS_KEY, JSON.stringify(map));
}

export async function deactivateBoost(slug: string, pageKey: string): Promise<void> {
  const r = kv();
  if (!r) return;
  const map = await readMapLive();
  if (map[pageKey]) {
    delete map[pageKey][slug];
    if (!Object.keys(map[pageKey]).length) delete map[pageKey];
  }
  await r.set(BOOSTS_KEY, JSON.stringify(map));
}
