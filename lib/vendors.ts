import { Vendor, CategorySlug } from "./types";
import { VENDORS as SEED } from "./data";
import { airtableConfigured, fetchAirtableVendors } from "./airtable";
import { kv } from "./kv";

// Single source of truth for vendor data. KV-FIRST: reads serve from a KV
// snapshot of the full list when it's fresh (one fast read), refreshing from
// Airtable only when the snapshot is stale or missing; on Airtable failure we
// serve the last-known-good snapshot, then the built-in seed data.
//
// WHY THE SNAPSHOT: the built-in SEED is a tiny ~21-vendor list. Before this,
// ANY transient Airtable failure (e.g. a rate-limit spike while the ISR fleet
// re-fetches) collapsed getAllVendors() to those 21 rows. getVendorBySlug()
// then returned undefined for the other ~1,160 vendors, the profile page called
// notFound(), and Next CACHED that 404 — leaving hundreds of real, published
// listings serving a sticky 404 until something forced a regen. We now keep a
// last-known-good copy of the full list in KV and fall back to that instead, so
// an Airtable blip can never shrink the public directory to the seed.

const SNAPSHOT_KEY = "vendors:snapshot";
// A KV snapshot younger than this serves directly (KV-FIRST): a cold page render
// does one fast KV read instead of paginating ~17 Airtable requests, which is
// what caused the crawl "No Response" timeouts and hammered Airtable. Set to the
// page revalidate window, so admin edits still go live within ~60s as before.
const SNAPSHOT_FRESH_MS = 60_000;

type Snapshot = { ts: number; vendors: Vendor[] };

async function readSnapshot(): Promise<Snapshot | null> {
  const r = kv();
  if (!r) return null;
  try {
    const raw = await r.get<Snapshot | Vendor[]>(SNAPSHOT_KEY);
    // Legacy bare-array snapshots (pre-KV-first) have no timestamp — treat them
    // as stale (ts:0) so they force a refresh but still serve as a fallback.
    if (Array.isArray(raw)) {
      return raw.length > 0 ? { ts: 0, vendors: raw } : null;
    }
    if (raw && Array.isArray(raw.vendors) && raw.vendors.length > 0) {
      return { ts: typeof raw.ts === "number" ? raw.ts : 0, vendors: raw.vendors };
    }
    return null;
  } catch (err) {
    console.error("[oohsource] vendor snapshot read failed:", err);
    return null;
  }
}

async function writeSnapshot(vendors: Vendor[]): Promise<void> {
  const r = kv();
  if (!r || vendors.length === 0) return;
  try {
    await r.set(SNAPSHOT_KEY, { ts: Date.now(), vendors });
  } catch (err) {
    // Non-fatal: a missing snapshot only degrades the fallback path.
    console.error("[oohsource] vendor snapshot write failed:", err);
  }
}

// "airtable" and "snapshot-fresh" are authoritative (a genuine miss is a real
// 404). "snapshot-stale"/"seed" mean Airtable was unavailable, so a missing slug
// must NOT be treated as a permanent 404 (see resolveVendorForPage).
export type VendorSource =
  | "airtable"
  | "snapshot-fresh"
  | "snapshot-stale"
  | "seed";

// Load the full vendor list plus where it came from. KV-first: a fresh snapshot
// serves immediately; otherwise we refresh from Airtable and re-cache; if
// Airtable is unavailable we serve the last-known-good snapshot, then the seed.
export async function loadAllVendors(): Promise<{
  vendors: Vendor[];
  source: VendorSource;
}> {
  if (!airtableConfigured()) return { vendors: SEED, source: "seed" };

  const cached = await readSnapshot();
  if (cached && Date.now() - cached.ts < SNAPSHOT_FRESH_MS) {
    return { vendors: cached.vendors, source: "snapshot-fresh" };
  }

  // Stale or missing snapshot -> refresh from Airtable and re-cache.
  try {
    const vendors = await fetchAirtableVendors();
    if (vendors.length > 0) {
      await writeSnapshot(vendors);
      return { vendors, source: "airtable" };
    }
    // An empty result is almost always a transient/config fault, not a truly
    // empty directory — treat it like a failure and fall back.
    console.error("[oohsource] Airtable returned 0 vendors; using fallback.");
  } catch (err) {
    console.error(
      "[oohsource] Airtable fetch failed, using cached snapshot:",
      err
    );
  }

  if (cached && cached.vendors.length > 0) {
    return { vendors: cached.vendors, source: "snapshot-stale" };
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
  // A miss is only a real 404 against an authoritative source. A fresh snapshot
  // is the full list (just up to ~60s old), so it counts; a stale snapshot or
  // the seed means Airtable was down — don't let Next cache that 404.
  const authoritative = source === "airtable" || source === "snapshot-fresh";
  if (!authoritative) {
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
