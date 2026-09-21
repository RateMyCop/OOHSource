import type { Metadata } from "next";
import { CATEGORIES } from "@/lib/data";
import { getAllVendors } from "@/lib/vendors";
import { SITE_URL } from "@/lib/lists";
import { DirectoryVendor, Vendor } from "@/lib/types";
import { DirectoryClient } from "./DirectoryClient";

export const revalidate = 60;

// Project a full Vendor down to only what the client directory renders and
// filters on. This is what keeps /directory under Googlebot's 2MB HTML limit:
// the full list is embedded for instant client-side filtering, so gallery, hero
// image, socials and contact fields are dropped, and the display description is
// truncated to a teaser (full text is preserved in the `search` haystack).
function teaser(text: string, maxWords: number): string {
  const words = (text || "").trim().split(/\s+/);
  if (words.length <= maxWords) return (text || "").trim();
  return words.slice(0, maxWords).join(" ").replace(/[.,;:]$/, "") + "…";
}

function toDirectoryVendor(v: Vendor): DirectoryVendor {
  return {
    slug: v.slug,
    name: v.name,
    subcategory: v.subcategory,
    categorySlug: v.categorySlug,
    formats: v.formats,
    location: v.location,
    coverage: v.coverage,
    tier: v.tier,
    verified: v.verified,
    website: v.website,
    ...(v.logo ? { logo: v.logo } : {}),
    description: teaser(v.description, 34),
    ...(v.googleRating ? { googleRating: v.googleRating, googleReviews: v.googleReviews } : {}),
    ...(v.yelpRating ? { yelpRating: v.yelpRating, yelpReviews: v.yelpReviews } : {}),
    ...(v.facebookRating ? { facebookRating: v.facebookRating, facebookReviews: v.facebookReviews } : {}),
    // Search-only extras. The FULL description is intentionally excluded (it's
    // the biggest payload contributor); the ~34-word teaser in `description` is
    // still searched client-side, plus name/subcategory/location/formats.
    keywords: [...(v.specialties ?? []), ...(v.marketsServed ?? [])]
      .join(" ")
      .toLowerCase(),
  };
}

export const metadata: Metadata = {
  title: "OOH Directory — Search 1,000+ OOH Companies",
  description:
    "Search the global out-of-home directory by category, format, and market. Media owners, agencies, printers, installers, and OOH technology.",
  alternates: { canonical: `${SITE_URL}/directory` },
};

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: {
    q?: string;
    category?: string;
    format?: string;
    verified?: string;
    sort?: string;
  };
}) {
  const vendors = (await getAllVendors()).map(toDirectoryVendor);
  const csv = (v?: string) =>
    typeof v === "string" ? v.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const initialQuery = typeof searchParams.q === "string" ? searchParams.q : "";
  const initialCategories = csv(searchParams.category);
  const initialFormats = csv(searchParams.format);
  const initialVerified = searchParams.verified === "1";
  const initialSort =
    typeof searchParams.sort === "string" ? searchParams.sort : "";

  return (
    <>
      <section className="wrap page-head">
        <div className="crumb">
          <a href="/">Home</a>
          <span>/</span>
          <span>Directory</span>
        </div>
        <h1>The out-of-home directory.</h1>
        <p className="lede">
          Every link in the OOH chain — filter by role, format, and market to
          shortlist the vendors you need.
        </p>
      </section>
      <div className="wrap">
        <DirectoryClient
          vendors={vendors}
          categories={CATEGORIES}
          initialQuery={initialQuery}
          initialCategories={initialCategories}
          initialFormats={initialFormats}
          initialVerified={initialVerified}
          initialSort={initialSort}
        />
      </div>
    </>
  );
}
