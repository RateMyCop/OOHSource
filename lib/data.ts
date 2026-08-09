import { Category, CategorySlug, Vendor } from "./types";

export const CATEGORIES: Category[] = [
  {
    slug: "media-owners-operators",
    index: "01",
    name: "Media Owners & Operators",
    blurb: "Companies that own out-of-home inventory.",
    subcategories: [
      "Billboard operators",
      "Transit & street furniture",
      "Place-based & venue",
      "DOOH screen networks",
    ],
  },
  {
    slug: "agencies-buyers",
    index: "02",
    name: "Agencies & Buyers",
    blurb: "Plan and buy out-of-home on behalf of brands.",
    subcategories: [
      "OOH specialist agencies",
      "Media planning & buying",
      "Programmatic DOOH",
    ],
  },
  {
    slug: "printing-production",
    index: "03",
    name: "Printing & Production",
    blurb: "Produce the physical media.",
    subcategories: [
      "Large-format printers",
      "Wide-format printers",
      "Vinyl & banner",
      "Fabric & mesh",
    ],
  },
  {
    slug: "installation-fabrication",
    index: "04",
    name: "Installation & Fabrication",
    blurb: "Build, install, and service the media.",
    subcategories: [
      "Installers & hangers",
      "Sign fabrication",
      "Permitting & site services",
    ],
  },
  {
    slug: "technology-data",
    index: "05",
    name: "Technology & Data",
    blurb: "Software, measurement, and data.",
    subcategories: [
      "DOOH ad tech (SSP/DSP)",
      "Measurement & attribution",
      "Audience data & planning",
      "Screen CMS",
    ],
  },
  {
    slug: "creative-design",
    index: "06",
    name: "Creative & Design",
    blurb: "Concept and design out-of-home campaigns.",
    subcategories: ["OOH creative studios", "Campaign & production art"],
  },
];

export function getCategory(slug: CategorySlug): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

// The two-sided-marketplace split, surfaced as the /agencies and /vendors hubs.
export const AGENCY_CATEGORY_SLUGS: CategorySlug[] = ["agencies-buyers"];
export const VENDOR_CATEGORY_SLUGS: CategorySlug[] = [
  "media-owners-operators",
  "printing-production",
  "installation-fabrication",
  "technology-data",
  "creative-design",
];

export function agencyCategories(): Category[] {
  return CATEGORIES.filter((c) => AGENCY_CATEGORY_SLUGS.includes(c.slug));
}
export function vendorCategories(): Category[] {
  return CATEGORIES.filter((c) => VENDOR_CATEGORY_SLUGS.includes(c.slug));
}

// Seed listings. `verified` reflects whether data has been confirmed from a
// primary source — most start false and become true after manual review.
export const VENDORS: Vendor[] = [
  {
    slug: "lamar-advertising",
    name: "Lamar Advertising",
    categorySlug: "media-owners-operators",
    subcategory: "Billboard operator",
    formats: ["Billboards", "Digital / DOOH", "Transit"],
    location: "Baton Rouge, USA",
    coverage: "National (USA)",
    website: "https://www.lamar.com",
    description:
      "One of the largest out-of-home companies in North America, operating billboards, logos, and transit displays.",
    specialties: ["Bulletins", "Posters", "Digital billboards", "Highway"],
    tier: "Free",
    verified: true,
  },
  {
    slug: "clear-channel-outdoor",
    name: "Clear Channel Outdoor",
    categorySlug: "media-owners-operators",
    subcategory: "Billboard operator",
    formats: ["Billboards", "Digital / DOOH", "Street furniture"],
    location: "San Antonio, USA",
    coverage: "Worldwide",
    website: "https://www.clearchanneloutdoor.com",
    description:
      "Global out-of-home media owner operating printed and digital displays across urban markets.",
    specialties: ["Digital billboards", "Airports", "Street furniture"],
    tier: "Free",
    verified: true,
  },
  {
    slug: "outfront-media",
    name: "OUTFRONT Media",
    categorySlug: "media-owners-operators",
    subcategory: "Billboard & transit operator",
    formats: ["Billboards", "Transit", "Digital / DOOH"],
    location: "New York, USA",
    coverage: "National (USA)",
    website: "https://www.outfront.com",
    description:
      "Major U.S. out-of-home media owner with a large billboard and transit advertising footprint.",
    specialties: ["Transit media", "Digital billboards", "Rail & subway"],
    tier: "Free",
    verified: true,
  },
  {
    slug: "talon-outdoor",
    name: "Talon",
    categorySlug: "agencies-buyers",
    subcategory: "OOH specialist agency",
    formats: ["Billboards", "Digital / DOOH", "Place-based"],
    location: "London, UK",
    coverage: "Worldwide",
    website: "https://www.talonooh.com",
    description:
      "Independent out-of-home media agency specialising in planning, buying, and data-led OOH.",
    specialties: ["Planning & buying", "Programmatic", "Data"],
    tier: "Free",
    verified: false,
  },
  {
    slug: "kinetic-worldwide",
    name: "Kinetic Worldwide",
    categorySlug: "agencies-buyers",
    subcategory: "OOH specialist agency",
    formats: ["Billboards", "Transit", "Digital / DOOH", "Place-based"],
    location: "Global",
    coverage: "Worldwide",
    website: "https://www.kineticww.com",
    description:
      "Global out-of-home planning and buying agency operating across dozens of markets.",
    specialties: ["Global planning", "Activation", "Measurement"],
    tier: "Free",
    verified: false,
  },
  {
    slug: "circle-graphics",
    name: "Circle Graphics",
    categorySlug: "printing-production",
    subcategory: "Large-format printer",
    formats: ["Billboards"],
    location: "Longmont, USA",
    coverage: "National (USA)",
    website: "https://www.circlegraphics.com",
    description:
      "Large-format digital printing for billboards, banners, and grand-format outdoor graphics.",
    specialties: ["Vinyl", "Bulletins", "Grand format", "Fabric"],
    tier: "Free",
    verified: true,
  },
  {
    slug: "britten",
    name: "Britten",
    categorySlug: "printing-production",
    subcategory: "Large-format printer",
    formats: ["Billboards", "Place-based"],
    location: "Traverse City, USA",
    coverage: "National (USA)",
    website: "https://www.brittenmedia.com",
    description:
      "Grand-format and large-format printing including billboard bulletins, banners, and building wraps.",
    specialties: ["Grand format", "Building wraps", "Banners", "Bulletins"],
    tier: "Free",
    verified: false,
  },
  {
    slug: "speedpro",
    name: "SpeedPro",
    categorySlug: "printing-production",
    subcategory: "Wide-format printer",
    formats: ["Place-based", "Billboards"],
    location: "Lakewood, USA",
    coverage: "National (USA)",
    website: "https://www.speedpro.com",
    description:
      "Nationwide network of wide-format print studios producing banners, signage, and large graphics.",
    specialties: ["Wide format", "Banners", "Event graphics"],
    tier: "Free",
    verified: false,
  },
  {
    slug: "poblocki-sign-company",
    name: "Poblocki Sign Company",
    categorySlug: "installation-fabrication",
    subcategory: "Sign fabrication",
    formats: ["Place-based", "Billboards"],
    location: "Milwaukee, USA",
    coverage: "National (USA)",
    website: "https://www.poblocki.com",
    description:
      "Sign manufacturing and fabrication for large-scale and architectural signage.",
    specialties: ["Sign fabrication", "Architectural signage", "Installation"],
    tier: "Free",
    verified: false,
  },
  {
    slug: "coast-sign",
    name: "Coast Sign",
    categorySlug: "installation-fabrication",
    subcategory: "Installer / hanger",
    formats: ["Place-based", "Billboards"],
    location: "Anaheim, USA",
    coverage: "Regional",
    website: "https://www.coastsign.com",
    description:
      "Fabrication, installation, and maintenance of large-format signs and outdoor displays.",
    specialties: ["Fabrication", "Installation", "Maintenance"],
    tier: "Free",
    verified: false,
  },
  {
    slug: "permit-advisors",
    name: "Permit Advisors",
    categorySlug: "installation-fabrication",
    subcategory: "Permitting & site services",
    formats: ["Billboards", "Digital / DOOH"],
    location: "Beverly Hills, USA",
    coverage: "National (USA)",
    website: "https://www.permitadvisors.com",
    description:
      "Sign and outdoor advertising permitting, zoning, and entitlement services.",
    specialties: ["Permitting", "Zoning", "Entitlements"],
    tier: "Free",
    verified: false,
  },
  {
    slug: "intersection",
    name: "Intersection",
    categorySlug: "technology-data",
    subcategory: "DOOH network / ad tech",
    formats: ["Digital / DOOH", "Transit", "Street furniture"],
    location: "New York, USA",
    coverage: "National (USA)",
    website: "https://www.intersection.com",
    description:
      "Smart-city media and technology company running transit and street-level digital networks.",
    specialties: ["Transit media", "Programmatic DOOH", "Smart city"],
    tier: "Free",
    verified: false,
  },
  {
    slug: "vistar-media",
    name: "Vistar Media",
    categorySlug: "technology-data",
    subcategory: "DOOH ad tech (SSP/DSP)",
    formats: ["Digital / DOOH", "Place-based"],
    location: "Philadelphia, USA",
    coverage: "Worldwide",
    website: "https://www.vistarmedia.com",
    description:
      "Programmatic technology platform connecting buyers and sellers of digital out-of-home.",
    specialties: ["Programmatic", "SSP", "DSP", "Ad exchange"],
    tier: "Featured",
    verified: false,
  },
  {
    slug: "geopath",
    name: "Geopath",
    categorySlug: "technology-data",
    subcategory: "Measurement & attribution",
    formats: ["Billboards", "Digital / DOOH", "Transit", "Place-based"],
    location: "New York, USA",
    coverage: "National (USA)",
    website: "https://geopath.org",
    description:
      "Non-profit audience measurement organisation providing impression data for out-of-home media.",
    specialties: ["Impressions", "Audience data", "Measurement"],
    tier: "Free",
    verified: false,
  },
  {
    slug: "grand-visual",
    name: "Grand Visual",
    categorySlug: "creative-design",
    subcategory: "OOH creative studio",
    formats: ["Digital / DOOH", "Experiential"],
    location: "London, UK",
    coverage: "Worldwide",
    website: "https://www.grandvisual.com",
    description:
      "Creative studio specialising in digital out-of-home campaigns and dynamic content.",
    specialties: ["DOOH creative", "Dynamic content", "Production"],
    tier: "Free",
    verified: false,
  },
];

export function getVendor(slug: string): Vendor | undefined {
  return VENDORS.find((v) => v.slug === slug);
}

export function vendorsByCategory(slug: CategorySlug): Vendor[] {
  return VENDORS.filter((v) => v.categorySlug === slug);
}

// Sort so paid tiers surface first (the pay-to-play mechanic).
const TIER_RANK: Record<string, number> = { Featured: 0, Free: 1 };
export function sortByTier(list: Vendor[]): Vendor[] {
  return [...list].sort(
    (a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier] || a.name.localeCompare(b.name)
  );
}
