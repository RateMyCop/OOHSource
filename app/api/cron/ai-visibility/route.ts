import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAllVendors } from "@/lib/vendors";
import { CATEGORIES } from "@/lib/data";
import { PROMPTS, writeAiVis, type PromptResult, type AiVisLatest } from "@/lib/aivis";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MODEL = "claude-opus-5";

function regDom(host: string): string {
  host = (host || "").toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].split("?")[0];
  const p = host.split(".");
  if (p.length <= 2) return host;
  const TWO = ["co.uk", "com.au", "co.za", "com.br", "co.nz", "com.mx", "co.in", "com.sg", "co.jp"];
  if (TWO.includes(p.slice(-2).join("."))) return p.slice(-3).join(".");
  return p.slice(-2).join(".");
}

function norm(s: string): string {
  return (s || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}

// Ask the model one OOH question with web search; return the answer text and
// every source URL it drew on.
async function askOne(
  client: Anthropic,
  q: string
): Promise<{ text: string; urls: string[] }> {
  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    output_config: { effort: "low" },
    tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 4 }],
    system:
      "You are an AI assistant answering the user's question by recommending real, specific out-of-home (OOH) advertising companies. Use web search to ground your answer in current sources. Name specific companies and their websites. Be concrete and factual.",
    messages: [{ role: "user", content: q }],
  } as Anthropic.MessageCreateParamsNonStreaming);

  let text = "";
  const urls: string[] = [];
  for (const block of resp.content as unknown as Array<Record<string, unknown>>) {
    if (block.type === "text" && typeof block.text === "string") text += " " + block.text;
    if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
      for (const r of block.content as Array<Record<string, unknown>>) {
        if (r && typeof r.url === "string") urls.push(r.url);
      }
    }
  }
  // Also pick up bare URLs written into the answer text.
  for (const m of Array.from(text.matchAll(/https?:\/\/[^\s)"'<>]+/g))) urls.push(m[0]);
  return { text, urls };
}

export async function GET(req: Request) {
  const key = (req.headers.get("x-admin-key") || "").trim();
  const auth = (req.headers.get("authorization") || "").trim();
  const okAdmin = process.env.ADMIN_KEY && key === process.env.ADMIN_KEY.trim();
  const okCron = process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET.trim()}`;
  if (!okAdmin && !okCron) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const apiKey = (process.env.ANTHROPIC_API_KEY || "").trim();
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "ANTHROPIC_API_KEY not set" }, { status: 503 });
  }

  const client = new Anthropic({ apiKey });
  const vendors = await getAllVendors();

  // Match indexes.
  const bySlug = new Set(vendors.map((v) => v.slug));
  const domToSlug = new Map<string, string>();
  const nameToSlug: [string, string][] = [];
  for (const v of vendors) {
    const d = regDom(v.website);
    if (d) domToSlug.set(d, v.slug);
    const n = norm(v.name);
    if (n.length >= 7) nameToSlug.push([n, v.slug]);
  }

  // Run prompts with limited concurrency.
  const prompts: PromptResult[] = [];
  const counts: Record<string, number> = {};
  let ohsCitations = 0;
  const CONC = 4;
  let idx = 0;
  async function worker() {
    while (idx < PROMPTS.length) {
      const p = PROMPTS[idx++];
      const hits = new Set<string>();
      let ohs = false;
      try {
        const { text, urls } = await askOne(client, p.q);
        const t = norm(text);
        const lurls = urls.map((u) => u.toLowerCase());
        // OOHsource directory URLs -> the exact vendor cited via OOHsource.
        for (const u of lurls) {
          const m = u.match(/oohsource\.com\/directory\/([a-z0-9-]+)/);
          if (m && bySlug.has(m[1])) hits.add(m[1]);
          const host = regDom(u);
          const bySlugFromDom = domToSlug.get(host);
          if (bySlugFromDom) hits.add(bySlugFromDom);
        }
        // Company names written into the answer.
        for (const [n, slug] of nameToSlug) if (t.includes(n)) hits.add(slug);
        ohs = lurls.some((u) => u.includes("oohsource.com")) || t.includes("oohsource");
      } catch (e) {
        console.error("[aivis] prompt failed:", p.id, (e as Error).message);
      }
      if (ohs) ohsCitations++;
      for (const slug of Array.from(hits)) counts[slug] = (counts[slug] || 0) + 1;
      prompts[PROMPTS.indexOf(p)] = { id: p.id, q: p.q, cat: p.cat, mentioned: Array.from(hits), oohsource: ohs };
    }
  }
  await Promise.all(Array.from({ length: CONC }, worker));

  // Category stats.
  const cat: AiVisLatest["cat"] = {};
  for (const c of CATEGORIES) {
    const inCat = vendors.filter((v) => v.categorySlug === c.slug);
    const nums = inCat.map((v) => counts[v.slug] || 0);
    const sum = nums.reduce((a, b) => a + b, 0);
    cat[c.slug] = {
      avg: inCat.length ? sum / inCat.length : 0,
      top: nums.length ? Math.max(...nums) : 0,
      cited: nums.filter((n) => n > 0).length,
      count: inCat.length,
    };
  }

  const data: AiVisLatest = {
    at: new Date().toISOString(),
    model: MODEL,
    totalVendors: vendors.length,
    counts,
    cat,
    ohsCitations,
    prompts: prompts.filter(Boolean),
  };
  await writeAiVis(data);

  return NextResponse.json({
    ok: true,
    at: data.at,
    promptsRun: data.prompts.length,
    vendorsCited: Object.keys(counts).length,
    ohsCitations,
    topCited: Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8),
  });
}
