import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSessionEmail } from "@/lib/auth";
import { ownedSlugsForEmail } from "@/lib/owner";
import { getVendorBySlug } from "@/lib/vendors";
import { getCategory } from "@/lib/data";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODEL = "claude-opus-5";

const SYSTEM = `You are an expert editor for OOHsource, a directory of out-of-home (OOH) advertising companies. You improve a company's listing so it converts buyers and gets cited by AI search assistants.

Rules:
- Rewrite and EXPAND the description to 80-150 words: clear, factual, scannable, in the third person.
- Use ONLY facts present in the provided information plus generally-true, non-specific OOH industry context. NEVER invent specifics: no fabricated years in business, client names, awards, statistics, certifications, coverage areas, or capabilities not stated.
- Lead with what the company does and who it serves; weave in the category, formats, and location naturally as keywords buyers and AI assistants search for.
- No marketing fluff, no "leading"/"best-in-class" superlatives, no first person, no emojis.

Respond with ONLY a JSON object (no markdown, no code fence):
{"tips": ["3 to 5 short, specific suggestions to improve this listing"], "description": "the rewritten description"}`;

function words(s: string): number {
  return (s || "").trim().split(/\s+/).filter(Boolean).length;
}

export async function POST(req: Request) {
  const email = getSessionEmail();
  if (!email) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const slug = String(body.slug ?? "").trim();
  if (!slug) return NextResponse.json({ error: "Missing listing." }, { status: 400 });

  const owned = await ownedSlugsForEmail(email);
  if (!owned.includes(slug)) {
    return NextResponse.json({ error: "You don't have access to this listing." }, { status: 403 });
  }
  const apiKey = (process.env.ANTHROPIC_API_KEY || "").trim();
  if (!apiKey) return NextResponse.json({ error: "AI optimizer is not configured yet." }, { status: 503 });

  const vendor = await getVendorBySlug(slug);
  if (!vendor) return NextResponse.json({ error: "Listing not found." }, { status: 404 });

  const currentDesc = String(body.description ?? "").trim() || vendor.description || "";
  const category = getCategory(vendor.categorySlug);

  // Rule-based completeness checks for the fields an owner can edit here.
  const checks: string[] = [];
  if (!vendor.heroImage) checks.push("Add a header image — listings with a banner get noticeably more clicks.");
  if (!vendor.gallery || vendor.gallery.length === 0) checks.push("Add a few portfolio photos of your work.");
  if (words(currentDesc) < 60) checks.push("Your description is short — a fuller 80–150 word description is favored by AI search.");
  if (!vendor.phone && !vendor.contactEmail) checks.push("Add a phone number or contact email so buyers can reach you.");

  const client = new Anthropic({ apiKey, timeout: 55000 });
  const userContent =
    `Company: ${vendor.name}\n` +
    `Category: ${category?.name || vendor.categorySlug}\n` +
    `Role/subcategory: ${vendor.subcategory}\n` +
    `Formats: ${(vendor.formats || []).join(", ") || "n/a"}\n` +
    `Location: ${vendor.location}\n` +
    `Coverage: ${vendor.coverage}\n` +
    `Specialties: ${(vendor.specialties || []).join(", ") || "n/a"}\n` +
    `Markets served: ${(vendor.marketsServed || []).join(", ") || "n/a"}\n` +
    `Website: ${vendor.website}\n\n` +
    `Current description:\n${currentDesc || "(none yet)"}`;

  try {
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      output_config: { effort: "low" },
      system: SYSTEM,
      messages: [{ role: "user", content: userContent }],
    } as Anthropic.MessageCreateParamsNonStreaming);

    let text = "";
    for (const block of resp.content as unknown as Array<Record<string, unknown>>) {
      if (block.type === "text" && typeof block.text === "string") text += block.text;
    }
    const m = text.match(/\{[\s\S]*\}/);
    const parsed = m ? JSON.parse(m[0]) : {};
    const aiTips: string[] = Array.isArray(parsed.tips) ? parsed.tips.map((t: unknown) => String(t)).slice(0, 5) : [];
    const improved = typeof parsed.description === "string" ? parsed.description.trim().slice(0, 6000) : "";

    return NextResponse.json({
      ok: true,
      suggestions: [...checks, ...aiTips],
      description: improved,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message.slice(0, 200) }, { status: 500 });
  }
}
