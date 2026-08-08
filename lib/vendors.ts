import { Vendor, CategorySlug } from "./types";
import { VENDORS as SEED } from "./data";
import { airtableConfigured, fetchAirtableVendors } from "./airtable";

// Single source of truth for vendor data.
// If Airtable env vars are set -> read from Airtable (revalidated every 60s).
// Otherwise (or on Airtable error) -> fall back to the built-in seed data.
export async function getAllVendors(): Promise<Vendor[]> {
  if (airtableConfigured()) {
    try {
      return await fetchAirtableVendors();
    } catch (err) {
      console.error(
        "[oohsource] Airtable fetch failed, falling back to seed data:",
        err
      );
      return SEED;
    }
  }
  return SEED;
}

export async function getVendorBySlug(
  slug: string
): Promise<Vendor | undefined> {
  const all = await getAllVendors();
  return all.find((v) => v.slug === slug);
}

export async function getVendorsByCategory(
  categorySlug: CategorySlug
): Promise<Vendor[]> {
  const all = await getAllVendors();
  return all.filter((v) => v.categorySlug === categorySlug);
}
