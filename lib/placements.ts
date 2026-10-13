import { getAllVendors, getVendorBySlug } from "@/lib/vendors";
import { getCategory } from "@/lib/data";
import { listForCategory, rankOfVendor, vendorScore } from "@/lib/lists";
import { FORMAT_TYPES, vendorsForFormat } from "@/lib/formats";
import type { Vendor } from "@/lib/types";

// A page on OOHsource where a listing surfaces, plus its current position there.
// Powers the dashboard's "Where you appear" table (Phase 1 — computed from the
// same ranking the public pages use, so the position matches what buyers see).
export type Placement = {
  page: string; // display title
  kind: "Category" | "Best list" | "Format";
  url: string; // relative URL of the page
  rank: number; // 1-based position on that page
  total: number; // how many listings rank on that surface
  topList: boolean; // part of a curated Top-N "Best of" list
};

// Category-page order: Featured first, then rating-weighted score, then name —
// mirrors app/category/[category]/page.tsx so the rank matches what buyers see.
function categoryRank(
  vendors: Vendor[],
  slug: string
): { rank: number; total: number } | null {
  const TIER: Record<string, number> = { Featured: 0, Free: 1 };
  const sorted = [...vendors].sort(
    (a, b) =>
      (TIER[a.tier] ?? 1) - (TIER[b.tier] ?? 1) ||
      vendorScore(b) - vendorScore(a) ||
      a.name.localeCompare(b.name)
  );
  const i = sorted.findIndex((v) => v.slug === slug);
  return i === -1 ? null : { rank: i + 1, total: sorted.length };
}

export async function getListingPlacements(slug: string): Promise<Placement[]> {
  const vendor = await getVendorBySlug(slug);
  if (!vendor) return [];
  const all = await getAllVendors();
  const catVendors = all.filter((v) => v.categorySlug === vendor.categorySlug);
  const placements: Placement[] = [];

  // 1) Its category page.
  const category = getCategory(vendor.categorySlug);
  if (category) {
    const cr = categoryRank(catVendors, slug);
    if (cr) {
      placements.push({
        page: category.name,
        kind: "Category",
        url: `/category/${category.slug}`,
        rank: cr.rank,
        total: cr.total,
        topList: false,
      });
    }
  }

  // 2) The curated "Best of" Top-N list for that category (if it ranks in it).
  const list = listForCategory(vendor.categorySlug);
  if (list) {
    const r = rankOfVendor(catVendors, slug, list.limit);
    if (r) {
      placements.push({
        page: list.title,
        kind: "Best list",
        url: `/best/${list.slug}`,
        rank: r,
        total: Math.min(list.limit, catVendors.length),
        topList: true,
      });
    }
  }

  // 3) Every format page the listing matches (keyword-matched, same as public).
  for (const ft of FORMAT_TYPES) {
    const fv = vendorsForFormat(all, ft);
    const i = fv.findIndex((v) => v.slug === slug);
    if (i !== -1) {
      placements.push({
        page: ft.name,
        kind: "Format",
        url: `/formats/${ft.slug}`,
        rank: i + 1,
        total: fv.length,
        topList: false,
      });
    }
  }

  // Best positions first; ties keep category/best (pushed earlier) ahead of formats.
  placements.sort((a, b) => a.rank - b.rank);
  return placements;
}
