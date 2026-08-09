export type CategorySlug =
  | "media-owners-operators"
  | "agencies-buyers"
  | "printing-production"
  | "installation-fabrication"
  | "technology-data"
  | "creative-design";

export type Tier = "Free" | "Premium" | "Featured";

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

export const FORMATS = [
  "Billboards",
  "Digital / DOOH",
  "Transit",
  "Street furniture",
  "Place-based",
  "Experiential",
] as const;

export type Format = (typeof FORMATS)[number];
