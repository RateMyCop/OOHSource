import { kv } from "./kv";
import type { Vendor, CategorySlug } from "./types";

// ── AI Visibility (AEO) ────────────────────────────────────────────────────
// Weekly, we ask an AI model real out-of-home questions and record which of our
// vendors — and OOHsource itself — get named/cited. Owners see how visible they
// are to AI search, benchmarked against their category, with actions to improve.

export type PromptCat = CategorySlug | "general";

export const PROMPTS: { id: string; q: string; cat: PromptCat }[] = [
  { id: "moo1", q: "What companies specialize in out-of-home and billboard advertising in the United States?", cat: "media-owners-operators" },
  { id: "moo2", q: "Who are the best billboard advertising companies for a regional out-of-home campaign?", cat: "media-owners-operators" },
  { id: "moo3", q: "What companies offer mobile billboard and LED truck advertising?", cat: "media-owners-operators" },
  { id: "moo4", q: "What are the best transit and airport advertising companies?", cat: "media-owners-operators" },
  { id: "moo5", q: "Which companies run place-based or venue advertising networks such as gyms, bars, and college campuses?", cat: "media-owners-operators" },
  { id: "moo6", q: "What digital out-of-home (DOOH) advertising networks operate in the US?", cat: "media-owners-operators" },
  { id: "pp1", q: "What companies print large-format billboard vinyl and out-of-home advertising graphics?", cat: "printing-production" },
  { id: "pp2", q: "Who are the best large-format printers for billboards and building wraps?", cat: "printing-production" },
  { id: "if1", q: "What companies install and fabricate billboards and outdoor advertising signs?", cat: "installation-fabrication" },
  { id: "ab1", q: "What are the best out-of-home (OOH) media buying and planning agencies?", cat: "agencies-buyers" },
  { id: "ab2", q: "Which agencies specialize in planning and buying out-of-home advertising campaigns?", cat: "agencies-buyers" },
  { id: "td1", q: "What are the leading DOOH ad-tech platforms and programmatic out-of-home SSPs and DSPs?", cat: "technology-data" },
  { id: "td2", q: "What software is used to manage and measure digital out-of-home advertising campaigns?", cat: "technology-data" },
  { id: "cd1", q: "Which creative studios specialize in out-of-home and billboard advertising design?", cat: "creative-design" },
  { id: "gen1", q: "What is the best online directory to find out-of-home advertising companies?", cat: "general" },
  { id: "gen2", q: "Where can I find and compare out-of-home advertising vendors and media owners?", cat: "general" },
  { id: "geo1", q: "What billboard and out-of-home advertising companies operate in Texas?", cat: "general" },
  { id: "geo2", q: "Which out-of-home advertising companies serve the United Kingdom?", cat: "general" },
];

export type PromptResult = {
  id: string;
  q: string;
  cat: PromptCat;
  mentioned: string[]; // vendor slugs named/cited in the AI answer
  oohsource: boolean; // did OOHsource / oohsource.com appear as a source?
};

export type AiVisLatest = {
  at: string; // ISO timestamp of the run
  model: string;
  totalVendors: number;
  counts: Record<string, number>; // slug -> # prompts it was cited in (cited only)
  cat: Record<string, { avg: number; top: number; cited: number; count: number }>;
  ohsCitations: number; // # prompts where OOHsource was cited
  prompts: PromptResult[];
};

const KEY = "aivis:latest";

export async function writeAiVis(data: AiVisLatest): Promise<void> {
  const r = kv();
  if (!r) return;
  await r.set(KEY, JSON.stringify(data));
}

export async function readAiVis(): Promise<AiVisLatest | null> {
  const r = kv();
  if (!r) return null;
  try {
    const raw = await r.get<string | AiVisLatest>(KEY);
    if (!raw) return null;
    return typeof raw === "string" ? (JSON.parse(raw) as AiVisLatest) : raw;
  } catch {
    return null;
  }
}

export type ScoreBand = "Needs Work" | "Fair" | "Good" | "Great" | "Excellent";

export function scoreBand(citations: number): { band: ScoreBand; pct: number } {
  // pct = gauge fill 0..1
  if (citations <= 0) return { band: "Needs Work", pct: 0.08 };
  if (citations === 1) return { band: "Fair", pct: 0.32 };
  if (citations <= 3) return { band: "Good", pct: 0.56 };
  if (citations <= 5) return { band: "Great", pct: 0.78 };
  return { band: "Excellent", pct: 0.96 };
}

export type VendorAiVis = {
  ran: boolean;
  at: string | null;
  citations: number;
  band: ScoreBand;
  gauge: number; // 0..1
  rank: number; // 1-based among all vendors
  totalVendors: number;
  percentileTop: number; // e.g. 12 => "Top 12%"
  catAvg: number;
  catTop: number;
  ohsCitations: number;
  prompts: { q: string; mentioned: boolean; oohsource: boolean }[];
};

// Combine the latest run into one vendor's view.
export function vendorAiVis(vendor: Vendor, data: AiVisLatest | null): VendorAiVis {
  if (!data) {
    return {
      ran: false, at: null, citations: 0, band: "Needs Work", gauge: 0.08,
      rank: 0, totalVendors: 0, percentileTop: 100, catAvg: 0, catTop: 0,
      ohsCitations: 0, prompts: [],
    };
  }
  const citations = data.counts[vendor.slug] || 0;
  const { band, pct } = scoreBand(citations);
  // rank: 1 + number of vendors with strictly more citations
  let ahead = 0;
  for (const n of Object.values(data.counts)) if (n > citations) ahead++;
  const rank = ahead + 1;
  const total = data.totalVendors || 1;
  const percentileTop = Math.max(1, Math.round((rank / total) * 100));
  const cs = data.cat[vendor.categorySlug] || { avg: 0, top: 0, cited: 0, count: 0 };
  const relevant = data.prompts
    .filter((p) => p.cat === vendor.categorySlug || p.cat === "general")
    .map((p) => ({
      q: p.q,
      mentioned: p.mentioned.includes(vendor.slug),
      oohsource: p.oohsource,
    }));
  return {
    ran: true,
    at: data.at,
    citations,
    band,
    gauge: pct,
    rank,
    totalVendors: total,
    percentileTop,
    catAvg: Math.round(cs.avg * 10) / 10,
    catTop: cs.top,
    ohsCitations: data.ohsCitations,
    prompts: relevant,
  };
}
