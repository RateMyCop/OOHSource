import { CategorySlug, Vendor } from "./types";

export const SITE_URL = "https://oohsource.com";

export interface RankedList {
  slug: string;
  title: string; // H1 / page title
  badgeLabel: string; // compact label for the embeddable rank badge
  category: CategorySlug;
  metaDescription: string;
  intro: string;
  limit: number;
}

// "Best of" / Top-N lists — one per major category. High-intent SEO pages and
// the format LLMs cite most. Ranking is transparent (see rankVendors).
export const LISTS: RankedList[] = [
  {
    slug: "top-ooh-media-owners",
    title: "Top 10 OOH Media Owners & Billboard Operators",
    badgeLabel: "Top OOH Media Owners",
    category: "media-owners-operators",
    metaDescription:
      "The top out-of-home media owners and billboard operators, ranked by verified customer ratings and market coverage.",
    intro:
      "The companies that own out-of-home inventory — billboards, transit, street furniture, and digital screen networks. Ranked by a transparent blend of verified Google and Yelp ratings (weighted by review volume) and market coverage.",
    limit: 10,
  },
  {
    slug: "best-large-format-printers",
    title: "Top 10 Large-Format & Billboard Printers",
    badgeLabel: "Top Large-Format Printers",
    category: "printing-production",
    metaDescription:
      "The best large-format and billboard printers for out-of-home advertising, ranked by verified ratings and coverage.",
    intro:
      "The production houses that print the physical media — billboards, banners, wraps, wallscapes, and fabric. Ranked by a transparent blend of verified Google and Yelp ratings (weighted by review volume) and market coverage.",
    limit: 10,
  },
  {
    slug: "top-dooh-adtech-companies",
    title: "Top 10 DOOH & Ad-Tech Companies",
    badgeLabel: "Top DOOH & Ad-Tech",
    category: "technology-data",
    metaDescription:
      "The top digital out-of-home (DOOH) and ad-tech companies — DSPs, SSPs, measurement, and screen software — ranked by verified ratings.",
    intro:
      "The software, data, and measurement layer behind out-of-home — programmatic DOOH platforms (DSP/SSP), attribution, audience data, and screen CMS. Ranked by a transparent blend of verified Google and Yelp ratings (weighted by review volume) and coverage.",
    limit: 10,
  },
  {
    slug: "best-ooh-agencies",
    title: "Top 10 Out-of-Home Advertising Agencies",
    badgeLabel: "Top OOH Agencies",
    category: "agencies-buyers",
    metaDescription:
      "The best out-of-home advertising agencies and media buyers, ranked by verified customer ratings and coverage.",
    intro:
      "The agencies and buyers that plan and buy out-of-home on behalf of brands. Ranked by a transparent blend of verified Google and Yelp ratings (weighted by review volume) and market coverage.",
    limit: 10,
  },
  {
    slug: "top-billboard-installers",
    title: "Top 10 Billboard Installation & Fabrication Companies",
    badgeLabel: "Top Billboard Installers",
    category: "installation-fabrication",
    metaDescription:
      "The top billboard installation and fabrication companies — installers, sign fabricators, structure builders — ranked by verified ratings.",
    intro:
      "The companies that build, install, and service the media — installers, sign fabricators, structure and crane services, and permitting. Ranked by a transparent blend of verified Google and Yelp ratings (weighted by review volume) and coverage.",
    limit: 10,
  },
];

export function getList(slug: string): RankedList | undefined {
  return LISTS.find((l) => l.slug === slug);
}

export function listForCategory(category: CategorySlug): RankedList | undefined {
  return LISTS.find((l) => l.category === category);
}

// Transparent ranking score: verified rating weighted by review volume, plus a
// small coverage bonus. Google is primary; Yelp contributes at half weight.
export function vendorScore(v: Vendor): number {
  const g = (v.googleRating ?? 0) * (1 + Math.log10((v.googleReviews ?? 0) + 1));
  const y = (v.yelpRating ?? 0) * (1 + Math.log10((v.yelpReviews ?? 0) + 1));
  const coverage = (v.coverage || "").toLowerCase();
  const covBonus = coverage.includes("world")
    ? 0.4
    : coverage.includes("national")
    ? 0.25
    : 0.1;
  return g + y * 0.5 + covBonus;
}

export function rankVendors(vendors: Vendor[], limit: number): Vendor[] {
  return [...vendors]
    .sort((a, b) => vendorScore(b) - vendorScore(a) || a.name.localeCompare(b.name))
    .slice(0, limit);
}

// A vendor's 1-based position within a list's ranking, or null if it doesn't
// place inside the list's limit. `vendors` is the full category pool (same
// input the /best/[slug] page ranks), so the position matches the page exactly.
export function rankOfVendor(
  vendors: Vendor[],
  slug: string,
  limit: number
): number | null {
  const ranked = rankVendors(vendors, limit);
  const idx = ranked.findIndex((v) => v.slug === slug);
  return idx === -1 ? null : idx + 1;
}

// A vendor's position across the WHOLE category (not capped at a list limit),
// plus the category size. Used by the owner dashboard to show "you're #14 of
// 52" even when outside the Top 10.
export function fullRankOfVendor(
  vendors: Vendor[],
  slug: string
): { rank: number; total: number } | null {
  const sorted = [...vendors].sort(
    (a, b) => vendorScore(b) - vendorScore(a) || a.name.localeCompare(b.name)
  );
  const idx = sorted.findIndex((v) => v.slug === slug);
  if (idx === -1) return null;
  return { rank: idx + 1, total: sorted.length };
}
