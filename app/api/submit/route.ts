import { NextResponse } from "next/server";
import { CATEGORIES } from "@/lib/data";
import {
  airtableConfigured,
  createAirtableRecord,
  updateAirtableRecord,
} from "@/lib/airtable";
import { emailConfigured, sendVerificationEmail } from "@/lib/email";

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
    : typeof body.formats === "string"
      ? body.formats
          .split(",")
          .map((f) => f.trim())
          .filter(Boolean)
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

  // Optional fields — only write when provided (avoids empty-value noise).
  const phone = String(body.phone ?? "").trim();
  const address = String(body.address ?? "").trim();
  const contactName = String(body.contactName ?? "").trim();
  const marketsServed = String(body.marketsServed ?? "").trim();
  if (phone) fields.Phone = phone;
  if (address) fields.Address = address;
  if (contactName) fields["Contact Name"] = contactName; // internal only, never displayed
  if (marketsServed) fields["Markets Served"] = marketsServed;

  const x = String(body.x ?? "").trim();
  const facebook = String(body.facebook ?? "").trim();
  const instagram = String(body.instagram ?? "").trim();
  const youtube = String(body.youtube ?? "").trim();
  if (x) fields.X = x;
  if (facebook) fields.Facebook = facebook;
  if (instagram) fields.Instagram = instagram;
  if (youtube) fields.YouTube = youtube;

  try {
    // Email double opt-in: when sending is configured, create the record as
    // "Unverified" with a token and email a confirmation link. Any failure in
    // that path falls back to the manual review queue, so submissions never break.
    if (emailConfigured()) {
      const token = crypto.randomUUID();
      let recordId = "";
      try {
        recordId = await createAirtableRecord({
          ...fields,
          Status: "Unverified",
          "Verify Token": token,
        });
      } catch (createErr) {
        console.error(
          "[oohsource] unverified create failed, using review queue:",
          createErr
        );
        await createAirtableRecord(fields); // Status already "Pending Review"
        return NextResponse.json({ ok: true, verify: false });
      }

      try {
        await sendVerificationEmail(email, name, token);
        return NextResponse.json({ ok: true, verify: true });
      } catch (mailErr) {
        console.error(
          "[oohsource] verification email failed, moving to review queue:",
          mailErr
        );
        if (recordId) {
          await updateAirtableRecord(recordId, {
            Status: "Pending Review",
            "Verify Token": "",
          });
        }
        return NextResponse.json({ ok: true, verify: false });
      }
    }

    await createAirtableRecord(fields); // Status "Pending Review"
    return NextResponse.json({ ok: true, verify: false });
  } catch (e) {
    console.error("[oohsource] submission failed:", e);
    return NextResponse.json(
      { error: "Something went wrong saving your listing. Please try again." },
      { status: 500 }
    );
  }
}
