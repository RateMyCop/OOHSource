import { NextResponse } from "next/server";
import { CATEGORIES } from "@/lib/data";
import { airtableConfigured, createAirtableRecord } from "@/lib/airtable";

export const dynamic = "force-dynamic";

function slugToCategoryName(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot — bots fill hidden fields; humans don't. Pretend success, save nothing.
  if (typeof body.company_url === "string" && body.company_url.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const name = String(body.name ?? "").trim();
  const website = String(body.website ?? "").trim();
  const email = String(body.email ?? "").trim();

  if (!name || !website || !email) {
    return NextResponse.json(
      { error: "Company name, website, and email are required." },
      { status: 400 }
    );
  }
  if (!/^https?:\/\/.+/i.test(website)) {
    return NextResponse.json(
      { error: "Please enter a valid website URL (including https://)." },
      { status: 400 }
    );
  }

  if (!airtableConfigured()) {
    return NextResponse.json(
      { error: "Submissions are temporarily unavailable. Please try again later." },
      { status: 503 }
    );
  }

  const categorySlug = String(body.category ?? "").trim();
  const formats = Array.isArray(body.formats)
    ? body.formats.map((f) => String(f))
    : [];

  const fields: Record<string, unknown> = {
    Name: name,
    Slug: slugify(name),
    Subcategory: String(body.subcategory ?? "").trim(),
    Formats: formats.join(", "),
    Location: String(body.location ?? "").trim(),
    Website: website,
    Description: String(body.description ?? "").trim(),
    Tier: "Free",
    Status: "Pending Review",
    "Submitter Email": email,
  };
  if (categorySlug) fields.Category = slugToCategoryName(categorySlug);
  const coverage = String(body.coverage ?? "").trim();
  if (coverage) fields.Coverage = coverage;

  try {
    await createAirtableRecord(fields);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[oohsource] submission failed:", e);
    return NextResponse.json(
      {
        error: "Something went wrong saving your listing. Please try again.",
        detail: String(e).slice(0, 500), // TEMP: remove after debugging
      },
      { status: 500 }
    );
  }
}
