import { Vendor, CategorySlug } from "./types";
import { VENDORS as SEED } from "./data";
import { airtableConfigured, fetchAirtableVendors } from "./airtable";
import { kv } from "./kv";

// Single source of truth for vendor data.
// If Airtable env vars are set -> read from Airtable (revalidated every 60s).
// Otherwise (or on Airtable error) -> fall back to a cached snapshot, then the
// built-in seed data.
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
// Throttle snapshot writes per warm instance so the ISR fleet doesn't hammer KV
// with a ~MB write on every render; the data only changes on admin edits.
let lastSnapshotWrite = 0;
const SNAPSHOT_WRITE_INTERVAL_MS = 60_000;

async function readSnapshot(): Promise<Vendor[] | null> {
  const r = kv();
  if (!r) return null;
  try {
    const data = await r.get<Vendor[]>(SNAPSHOT_KEY);
    return Array.isArray(data) && data.length > 0 ? data : null;
  } catch (err) {
    console.error("[oohsource] vendor snapshot read failed:", err);
    return null;
  }
}

async function writeSnapshot(vendors: Vendor[]): Promise<void> {
  const r = kv();
  if (!r || vendors.length === 0) return;
  const now = Date.now();
  if (now - lastSnapshotWrite < SNAPSHOT_WRITE_INTERVAL_MS) return;
  lastSnapshotWrite = now;
  try {
    await r.set(SNAPSHOT_KEY, vendors);
  } catch (err) {
    // Non-fatal: a missing snapshot only degrades the fallback path.
    console.error("[oohsource] vendor snapshot write failed:", err);
  }
}

export type VendorSource = "airtable" | "snapshot" | "seed";

// Load the full vendor list plus where it came from. "airtable" is the only
// authoritative source; "snapshot"/"seed" mean Airtable was unavailable, so a
// missing slug must NOT be treated as a permanent 404 (see resolveVendorForPage).
export async function loadAllVendors(): Promise<{
  vendors: Vendor[];
  source: VendorSource;
}> {
  if (airtableConfigured()) {
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
    const snap = await readSnapshot();
    if (snap) return { vendors: snap, source: "snapshot" };
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
  if (source !== "airtable") {
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
