import type { Vendor } from "./types";
import { vendorScore } from "./lists";

// City landing pages targeting "outdoor advertising <city>" searches. Each city
// lists the OOH companies that serve it — national/worldwide operators always
// qualify, plus any vendor whose location or markets served match the city or
// its region. Add new cities here; the route, sitemap, and hub pick them up.
export interface City {
  slug: string;
  name: string; // "Fremont"
  state: string; // abbreviation, "CA"
  stateName: string; // "California"
  region: string; // "San Francisco Bay Area"
  // Lowercase tokens that mark a vendor as serving this city when found in its
  // location, coverage, or markets-served. Keep tokens distinctive (avoid short
  // substrings that false-match, e.g. "ca").
  match: string[];
  intro: string;
}

export const CITIES: City[] = [
  {
    slug: "fremont",
    name: "Fremont",
    state: "CA",
    stateName: "California",
    region: "San Francisco Bay Area",
    match: [
      "fremont",
      "bay area",
      "san francisco",
      "oakland",
      "san jose",
      "silicon valley",
      "california",
    ],
    intro:
      "Planning out-of-home advertising in Fremont? These are the OOH media owners, printers, installers, and agencies that serve Fremont and the wider San Francisco Bay Area — from roadside and digital billboards to transit, street-level, and place-based media (DOOH). Compare coverage and formats below, then reach out directly.",
  },
];

export function getCity(slug: string): City | undefined {
  return CITIES.find((c) => c.slug === slug);
}

function servesCity(v: Vendor, c: City): boolean {
  const coverage = (v.coverage || "").toLowerCase();
  if (coverage.includes("worldwide") || coverage.includes("national")) return true;
  const hay = [v.location, v.coverage, ...(v.marketsServed || [])]
    .join(" ")
    .toLowerCase();
  return c.match.some((tok) => hay.includes(tok));
}

// Vendors that serve a city, ranked by the same transparent score used on the
// /best lists, capped to a readable number.
export function vendorsForCity(vendors: Vendor[], c: City, limit = 15): Vendor[] {
  return vendors
    .filter((v) => servesCity(v, c))
    .sort((a, b) => vendorScore(b) - vendorScore(a))
    .slice(0, limit);
}
