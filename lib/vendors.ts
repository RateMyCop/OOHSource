import { Vendor, CategorySlug } from "./types";
import { VENDORS as SEED } from "./data";
import { airtableConfigured, fetchAirtableVendors } from "./airtable";
import { kv } from "./kv";

// Single source of truth for vendor data.
//
// RUNTIME reads serve the full list from a KV snapshot via a CACHED fetch to the
// Upstash REST API — one ~300ms read instead of ~17 paginated Airtable requests
// (~14s), which is what made cold renders time out under crawl load. A cron
// (/api/cron/refresh-vendors) keeps the snapshot fresh from Airtable, so no page
// render ever waits on Airtable pagination. If the snapshot is unavailable we
// fall back to Airtable, then the built-in seed.
//
// BUILD reads use Airtable's cached fetch directly — the KV client uses no-store
// fetches that throw DYNAMIC_SERVER_USAGE and hang `next build` when run across
// ~1,184 pages, so KV is strictly runtime-only (see writeSnapshot/isBuildPhase).
//
// The snapshot also guards against the sticky-404 storm: the built-in SEED is a
// tiny ~21-vendor list, and a transient Airtable failure must never collapse the
// public directory to it (which previously cached 404s for ~1,160 real vendors).

const SNAPSHOT_KEY = "vendors:snapshot";

// During `next build`, static generation of ~1,184 pages must NOT touch the KV
// client (its no-store fetches throw DYNAMIC_SERVER_USAGE and hang the build) —
// so at build we read Airtable via its cached fetch, and only at runtime do we
// serve from the KV snapshot.
function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

// Read the snapshot via a CACHED fetch to the Upstash REST API (NOT the no-store
// client). This is static-generation-safe and lets a cold render serve the full
// list in one ~300ms read instead of paginating ~17 Airtable requests (~14s).
// Returns null on any problem so callers fall back to Airtable — the site keeps
// working even if this path is unavailable.
async function readSnapshotViaCachedFetch(): Promise<Vendor[] | null> {
  const url =
    process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
  const token =
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
  if (!url || !token) return null;
  try {
    const res = await fetch(`${url}/get/${SNAPSHOT_KEY}`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { result?: unknown };
    let value: unknown = body?.result;
    if (value == null) return null;
    // The KV client JSON-stringifies on set, so `result` is a JSON string; parse
    // (defensively up to twice in case of double-encoding).
    for (let i = 0; i < 2 && typeof value === "string"; i++) {
      try {
        value = JSON.parse(value);
      } catch {
        return null;
      }
    }
    if (
      Array.isArray(value) &&
      value.length > 0 &&
      typeof (value[0] as { slug?: unknown })?.slug === "string"
    ) {
      return value as Vendor[];
    }
    return null;
  } catch (err) {
    console.error("[oohsource] cached snapshot fetch failed:", err);
    return null;
  }
}

// Persist the snapshot via the KV client (a no-store write). Only ever called at
// RUNTIME — the cron refresh and the rare Airtable fallback — never during the
// build (guarded), so it can't hang static generation.
async function writeSnapshot(vendors: Vendor[]): Promise<void> {
  if (isBuildPhase()) return;
  const r = kv();
  if (!r || vendors.length === 0) return;
  try {
    await r.set(SNAPSHOT_KEY, vendors);
  } catch (err) {
    console.error("[oohsource] vendor snapshot write failed:", err);
  }
}

// Refresh the snapshot from Airtable. Called by the cron so renders never have
// to paginate Airtable themselves. Returns the number of vendors written.
export async function refreshVendorSnapshot(): Promise<number> {
  if (!airtableConfigured()) return 0;
  const vendors = await fetchAirtableVendors();
  if (vendors.length > 0) await writeSnapshot(vendors);
  return vendors.length;
}

export type VendorSource = "airtable" | "snapshot" | "seed";

// Load the full vendor list plus where it came from. "airtable"/"snapshot" are
// authoritative (the full list); "seed" means both Airtable AND the snapshot
// were unavailable, so a missing slug must NOT be cached as a permanent 404
// (see resolveVendorForPage).
export async function loadAllVendors(): Promise<{
  vendors: Vendor[];
  source: VendorSource;
}> {
  if (!airtableConfigured()) return { vendors: SEED, source: "seed" };

  // BUILD: read Airtable via its cached (deduped) fetch — never the snapshot,
  // which is large and would slow static generation.
  if (isBuildPhase()) {
    try {
      const vendors = await fetchAirtableVendors();
      if (vendors.length > 0) return { vendors, source: "airtable" };
    } catch (err) {
      console.error("[oohsource] Airtable build fetch failed:", err);
    }
    return { vendors: SEED, source: "seed" };
  }

  // RUNTIME: snapshot-first (fast cold renders). Fall back to Airtable (and
  // re-seed the snapshot) only if the snapshot is unavailable.
  const snap = await readSnapshotViaCachedFetch();
  if (snap) return { vendors: snap, source: "snapshot" };
  try {
    const vendors = await fetchAirtableVendors();
    if (vendors.length > 0) {
      await writeSnapshot(vendors);
      return { vendors, source: "airtable" };
    }
    console.error("[oohsource] Airtable returned 0 vendors; using seed.");
  } catch (err) {
    console.error("[oohsource] Airtable fetch failed; using seed:", err);
  }
  return { vendors: SEED, source: "seed" };
}

export async function getAllVendors(): Promise<Vendor[]> {
  return (await loadAllVendors()).vendors;
}

export async function getVendorBySlug(
  slug: string
): Promise<Vendor | undefined> {
  const all = await getAllVendors();
  return all.find((v) => v.slug === slug);
}

// Resolve a vendor for its public profile page. Returns the vendor, or null for
// a genuine miss against authoritative Airtable data (a real 404). If the
// vendor isn't found but the data source was a degraded fallback, we THROW
// instead of returning null: throwing keeps Next from caching a 404 for a
// listing that likely exists, and the render falls back to the last good page
// (stale-while-revalidate) and retries on the next request.
export async function resolveVendorForPage(
  slug: string
): Promise<Vendor | null> {
  const { vendors, source } = await loadAllVendors();
  const vendor = vendors.find((v) => v.slug === slug);
  if (vendor) return vendor;
  // "airtable" and "snapshot" are the full list, so a miss is a real 404. Only
  // "seed" (both Airtable and the snapshot were unavailable) is degraded — throw
  // there so Next doesn't cache a 404 for a listing that likely exists.
  if (source === "seed") {
    throw new Error(
      `Vendor data source degraded (${source}); refusing to cache 404 for "${slug}"`
    );
  }
  return null;
}

export async function getVendorsByCategory(
  categorySlug: CategorySlug
): Promise<Vendor[]> {
  const all = await getAllVendors();
  return all.filter((v) => v.categorySlug === categorySlug);
}

export async function getVendorsInCategories(
  categorySlugs: CategorySlug[]
): Promise<Vendor[]> {
  const all = await getAllVendors();
  return all.filter((v) => categorySlugs.includes(v.categorySlug));
}
