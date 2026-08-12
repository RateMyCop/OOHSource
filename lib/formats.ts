import { Vendor } from "./types";

// Richer OOH format taxonomy (industry-standard groupings) used for browse +
// long-tail SEO pages. Each type matches vendors by keyword against their
// name / role / specialties / description — no per-vendor re-tagging needed.

export type FormatType = {
  slug: string;
  name: string;
  group: string;
  blurb: string;
  keywords: string[];
};

export const FORMAT_GROUPS = [
  "Billboards & Large Format",
  "Digital / DOOH",
  "Transit",
  "Street Furniture",
  "Place-Based",
  "Alternative & Experiential",
] as const;

export const FORMAT_TYPES: FormatType[] = [
  // Billboards & Large Format
  {
    slug: "digital-billboards",
    name: "Digital Billboards",
    group: "Billboards & Large Format",
    blurb:
      "Digital billboards are large roadside LED screens that rotate multiple advertisers and support motion, dayparting, and real-time creative. Browse the media owners and networks operating digital bulletin inventory across highways and city centers.",
    keywords: ["digital billboard", "digital bulletin", "led billboard", "digital 48", "dm6", "d96", "digital roadside"],
  },
  {
    slug: "static-billboards",
    name: "Static Billboards & Bulletins",
    group: "Billboards & Large Format",
    blurb:
      "Static billboards and bulletins are the classic large-format roadside panels printed on vinyl or paper. Find operators of traditional bulletins, 30-sheet, and poster panels for long-term, high-impact placements.",
    keywords: ["static billboard", "static bulletin", "30-sheet", "poster panel", "classic billboard", "vinyl billboard"],
  },
  {
    slug: "wallscapes-and-murals",
    name: "Wallscapes & Hand-Painted Murals",
    group: "Billboards & Large Format",
    blurb:
      "Wallscapes and hand-painted murals turn the sides of buildings into oversized advertising canvases. Browse specialists in large-format wall media, building wraps, and hand-painted advertising.",
    keywords: ["wallscape", "mural", "hand-painted", "hand painted", "wall wrap", "building wrap", "wall mural"],
  },
  {
    slug: "spectaculars",
    name: "Spectaculars & Landmark Displays",
    group: "Billboards & Large Format",
    blurb:
      "Spectaculars are premium, oversized, often animated displays in the most iconic locations — think Times Square and marquee city intersections. Find owners of landmark spectacular inventory.",
    keywords: ["spectacular", "times square", "landmark", "iconic display", "marquee"],
  },
  // Digital / DOOH
  {
    slug: "digital-out-of-home",
    name: "Digital Out-of-Home (DOOH)",
    group: "Digital / DOOH",
    blurb:
      "Digital out-of-home covers the full universe of internet-connected screens — from roadside to place-based — increasingly bought programmatically. Browse DOOH networks, SSPs, DSPs, and the technology behind them.",
    keywords: ["dooh", "digital out-of-home", "digital out of home", "programmatic dooh", "digital screen network", "digital signage"],
  },
  {
    slug: "led-displays",
    name: "LED Displays & Video Walls",
    group: "Digital / DOOH",
    blurb:
      "LED displays and video walls are the hardware powering modern digital out-of-home. Find LED manufacturers, integrators, and operators of large-scale architectural and roadside screens.",
    keywords: ["led display", "led screen", "video wall", "led sign", "led manufacturer", "led video"],
  },
  // Transit
  {
    slug: "transit-advertising",
    name: "Transit Advertising",
    group: "Transit",
    blurb:
      "Transit advertising reaches commuters across bus, rail, and subway environments. Browse operators of transit media that put brands in front of moving urban audiences all day.",
    keywords: ["transit", "commuter", "public transport", "transit media", "transit advertising"],
  },
  {
    slug: "bus-advertising",
    name: "Bus Advertising",
    group: "Transit",
    blurb:
      "Bus advertising spans full and partial wraps, kings, queens, tails, and interior cards on buses that circulate through dense city routes. Find bus media owners and operators.",
    keywords: ["bus advertising", "bus wrap", "bus interior", "bus exterior", "king bus", "bus media", "double-decker bus"],
  },
  {
    slug: "rail-and-subway",
    name: "Rail & Subway Advertising",
    group: "Transit",
    blurb:
      "Rail and subway advertising reaches captive commuter audiences on platforms, in stations, and inside train cars. Browse operators of metro, subway, and commuter-rail media.",
    keywords: ["subway", "rail advertising", "metro", "train station", "commuter rail", "underground"],
  },
  {
    slug: "taxi-and-rideshare",
    name: "Taxi & Rideshare Advertising",
    group: "Transit",
    blurb:
      "Taxi and rideshare advertising uses cartop screens, wraps, and in-car displays on vehicles moving through the busiest parts of the city. Find rideshare and taxi media networks.",
    keywords: ["taxi", "rideshare", "cartop", "cab top", "in-car screen", "rideshare screen"],
  },
  {
    slug: "mobile-billboards",
    name: "Mobile Billboards & Truckside",
    group: "Transit",
    blurb:
      "Mobile billboards and truckside advertising bring the message to the audience — driving targeted routes with large-format displays, glass trucks, and LED trucks. Browse mobile media operators.",
    keywords: ["truckside", "mobile billboard", "mobile advertising", "ad truck", "glass truck", "led truck", "mobile media"],
  },
  {
    slug: "airport-advertising",
    name: "Airport Advertising",
    group: "Transit",
    blurb:
      "Airport advertising reaches affluent, dwell-time travelers across terminals, gates, baggage claim, and jet bridges. Find operators of in-airport and aviation media.",
    keywords: ["airport", "terminal", "aviation media", "in-airport", "jet bridge", "baggage claim"],
  },
  // Street Furniture
  {
    slug: "street-furniture",
    name: "Street Furniture & Urban Panels",
    group: "Street Furniture",
    blurb:
      "Street furniture puts advertising at pedestrian eye level on urban panels, bus shelters, and city information displays. Browse street furniture media owners.",
    keywords: ["street furniture", "urban panel", "city information", "6-sheet", "6 sheet", "sidewalk panel"],
  },
  {
    slug: "bus-shelters",
    name: "Bus Shelter Advertising",
    group: "Street Furniture",
    blurb:
      "Bus shelter advertising reaches both waiting riders and passing traffic with illuminated street-level panels. Find bus shelter and transit shelter media operators.",
    keywords: ["bus shelter", "transit shelter", "shelter advertising", "shelter panel"],
  },
  {
    slug: "newsstands-and-kiosks",
    name: "Newsstands & Kiosks",
    group: "Street Furniture",
    blurb:
      "Newsstand and kiosk advertising anchors high-footfall corners and transit entrances with compact, repeatable street-level media. Browse kiosk and newsstand operators.",
    keywords: ["newsstand", "kiosk", "information kiosk", "ike kiosk", "digital kiosk"],
  },
  // Place-Based
  {
    slug: "mall-and-retail-media",
    name: "Mall & Retail Media",
    group: "Place-Based",
    blurb:
      "Mall and retail media reach shoppers in a buying mindset across shopping centers, concourses, and in-store screens. Find owners of retail and mall advertising networks.",
    keywords: ["mall", "shopping center", "shopping centre", "retail media", "in-store", "shopper marketing"],
  },
  {
    slug: "gym-and-fitness",
    name: "Gym & Fitness Advertising",
    group: "Place-Based",
    blurb:
      "Gym and fitness advertising reaches engaged, health-focused audiences during long dwell times in health clubs and studios. Browse fitness-venue media networks.",
    keywords: ["gym", "fitness", "health club", "studio media", "wellness"],
  },
  {
    slug: "bar-and-restaurant",
    name: "Bar & Restaurant Advertising",
    group: "Place-Based",
    blurb:
      "Bar and restaurant advertising reaches social audiences in nightlife and dining venues via screens, table media, and restroom panels. Find place-based media in food and nightlife.",
    keywords: ["bar", "restaurant", "nightlife", "pub", "tavern", "restroom advertising", "coffee shop"],
  },
  {
    slug: "convenience-and-gas-station",
    name: "Convenience & Gas Station Media",
    group: "Place-Based",
    blurb:
      "Convenience-store and gas-station media reach audiences at the forecourt and point of purchase with fuel-pump toppers and in-store screens. Browse c-store and forecourt operators.",
    keywords: ["convenience store", "gas station", "forecourt", "c-store", "fuel pump", "petrol station"],
  },
  {
    slug: "cinema-advertising",
    name: "Cinema Advertising",
    group: "Place-Based",
    blurb:
      "Cinema advertising delivers full-attention, big-screen brand moments to captive movie audiences before the feature. Find cinema advertising networks and operators.",
    keywords: ["cinema", "movie theater", "movie theatre", "pre-show", "on-screen advertising", "big screen"],
  },
  {
    slug: "office-and-residential-screens",
    name: "Office & Residential Screens",
    group: "Place-Based",
    blurb:
      "Office and residential screen networks reach professionals and residents in lobbies, elevators, and communal spaces with high-frequency, uncluttered media. Browse building-based operators.",
    keywords: ["office", "elevator", "lobby", "residential screen", "elevator screen", "apartment", "building media"],
  },
  {
    slug: "healthcare-advertising",
    name: "Healthcare & Waiting-Room Media",
    group: "Place-Based",
    blurb:
      "Healthcare media reach patients during long, attentive dwell times in doctors' offices, pharmacies, and hospitals. Find point-of-care and waiting-room advertising networks.",
    keywords: ["doctor", "healthcare", "hospital", "medical office", "pharmacy", "waiting room", "point-of-care", "point of care"],
  },
  // Alternative & Experiential
  {
    slug: "wild-posting",
    name: "Wild Posting & Street Posters",
    group: "Alternative & Experiential",
    blurb:
      "Wild posting (fly posting) blankets high-traffic urban walls and construction sites with clusters of street posters for a grassroots, culturally-embedded feel. Browse wild posting specialists.",
    keywords: ["wild posting", "wheatpaste", "wheat paste", "street poster", "flyposting", "fly posting", "snipe", "wildposting"],
  },
  {
    slug: "aerial-advertising",
    name: "Aerial Advertising",
    group: "Alternative & Experiential",
    blurb:
      "Aerial advertising uses banner planes, blimps, and drones to reach crowds at beaches, events, and stadiums from the sky. Find aerial and rooftop media specialists.",
    keywords: ["aerial", "airplane banner", "blimp", "banner plane", "drone advertising", "rooftop"],
  },
  {
    slug: "experiential-and-guerrilla",
    name: "Experiential & Guerrilla",
    group: "Alternative & Experiential",
    blurb:
      "Experiential and guerrilla marketing create unexpected, shareable brand moments through activations, pop-ups, projections, and stunts. Browse experiential and non-traditional specialists.",
    keywords: ["experiential", "guerrilla", "activation", "pop-up", "projection", "stunt", "non-traditional", "street team"],
  },
];

export function getFormatType(slug: string): FormatType | undefined {
  return FORMAT_TYPES.find((f) => f.slug === slug);
}

function textOf(v: Vendor): string {
  return `${v.name} ${v.subcategory} ${(v.specialties || []).join(" ")} ${v.description}`.toLowerCase();
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Whole-word / whole-phrase matching so short keywords like "bar" or "mall"
// don't false-match "Barrett" or "small".
const reCache = new Map<string, RegExp[]>();
function regexesFor(type: FormatType): RegExp[] {
  let res = reCache.get(type.slug);
  if (!res) {
    res = type.keywords.map((k) => new RegExp(`\\b${escapeRe(k)}\\b`, "i"));
    reCache.set(type.slug, res);
  }
  return res;
}

// Vendors relevant to a format type, ranked (Featured first, then verified).
export function vendorsForFormat(vendors: Vendor[], type: FormatType): Vendor[] {
  const res = regexesFor(type);
  return vendors
    .filter((v) => {
      const t = textOf(v);
      return res.some((re) => re.test(t));
    })
    .sort((a, b) => {
      const fa = a.tier === "Featured" ? 1 : 0;
      const fb = b.tier === "Featured" ? 1 : 0;
      if (fa !== fb) return fb - fa;
      const va = a.verified ? 1 : 0;
      const vb = b.verified ? 1 : 0;
      if (va !== vb) return vb - va;
      return a.name.localeCompare(b.name);
    });
}
