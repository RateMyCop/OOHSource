export type CategorySlug =
  | "media-owners-operators"
  | "agencies-buyers"
  | "printing-production"
  | "installation-fabrication"
  | "technology-data"
  | "creative-design";

export type Tier = "Free" | "Featured";

export interface Category {
  slug: CategorySlug;
  index: string; // "01".."06"
  name: string;
  blurb: string;
  subcategories: string[];
}

export interface Vendor {
  slug: string;
  name: string;
  categorySlug: CategorySlug;
  subcategory: string;
  formats: string[];
  location: string; // "City, Country"
  coverage: string; // "Worldwide" | "National (USA)" | "Regional"
  website: string;
  logo?: string; // optional explicit logo URL (else derived from the website)
  heroImage?: string; // banner image (og:image) shown atop the detail page
  gallery?: string[]; // portfolio image URLs shown in a gallery on the profile
  x?: string; // social links (optional)
  facebook?: string;
  instagram?: string;
  youtube?: string;
  linkedin?: string;
  contactEmail?: string; // public contact email, shown on the listing
  googleRating?: number; // reviews (optional)
  googleReviews?: number;
  yelpRating?: number;
  yelpReviews?: number;
  facebookRating?: number;
  facebookReviews?: number;
  phone?: string; // optional, shown publicly
  address?: string; // optional full address, shown publicly
  marketsServed?: string[]; // states/metros a multi-location company serves
  description: string;
  specialties: string[];
  tier: Tier;
  verified: boolean;
}

// Lean shape VendorCard needs to render. It's a structural subset of Vendor, so
// a full Vendor is assignable wherever a CardVendor is expected (SSR pages keep
// passing full objects) while lightweight projections also satisfy it.
export interface CardVendor {
  slug: string;
  name: string;
  subcategory: string;
  formats: string[];
  location: string;
  coverage: string;
  tier: Tier;
  verified: boolean;
  logo?: string;
  website: string;
  description: string;
  googleRating?: number;
  googleReviews?: number;
  yelpRating?: number;
  yelpReviews?: number;
  facebookRating?: number;
  facebookReviews?: number;
}

// What the client-side directory needs: card fields + category (for filtering) +
// extra searchable keywords. Deliberately OMITS gallery, hero image, socials,
// contact/phone/address AND the full description body (only the ~34-word teaser
// in `description` ships) so the full list serialized into the /directory HTML
// stays well under Googlebot's 2MB indexing limit. `keywords` carries the
// search-only terms not already on the object (specialties + markets served).
export interface DirectoryVendor extends CardVendor {
  categorySlug: CategorySlug;
  keywords: string;
}

export const FORMATS = [
  "Billboards",
  "Digital / DOOH",
  "Transit",
  "Street furniture",
  "Place-based",
  "Experiential",
] as const;

export type Format = (typeof FORMATS)[number];
