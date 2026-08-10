import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSessionEmail } from "@/lib/auth";
import { ownedSlugsForEmail } from "@/lib/owner";
import { findVendorRecordIdBySlug, updateAirtableRecord } from "@/lib/airtable";

export const dynamic = "force-dynamic";

const isUrl = (s: string) => /^https?:\/\/.+/i.test(s);

// Owner self-service edit. Only the signed-in owner of the listing may write,
// and only a fixed set of safe fields. Status is never touched, so the listing
// stays Published.
export async function POST(req: Request) {
  const email = getSessionEmail();
  if (!email) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const slug = String(body.slug ?? "").trim();
  if (!slug) {
    return NextResponse.json({ error: "Missing listing." }, { status: 400 });
  }

  // Authorization: the session's email must own this exact slug.
  const owned = await ownedSlugsForEmail(email);
  if (!owned.includes(slug)) {
    return NextResponse.json(
      { error: "You don't have access to this listing." },
      { status: 403 }
    );
  }

  const fields: Record<string, unknown> = {};

  const website = String(body.website ?? "").trim();
  if (website) {
    if (!isUrl(website)) {
      return NextResponse.json(
        { error: "Website must start with http:// or https://" },
        { status: 400 }
      );
    }
    fields.Website = website;
  }

  // Optional contact fields — empty is allowed (clears the value).
  fields.Phone = String(body.phone ?? "").trim();
  fields.Address = String(body.address ?? "").trim();

  // Description: only overwrite when non-empty, to avoid an accidental wipe.
  const description = String(body.description ?? "").trim();
  if (description) fields.Description = description.slice(0, 6000);

  const hero = String(body.heroImage ?? "").trim();
  if (hero && !isUrl(hero)) {
    return NextResponse.json(
      { error: "Header image must be a valid image URL (http/https)." },
      { status: 400 }
    );
  }
  fields["Hero Image"] = hero; // empty clears it

  const gallery = String(body.gallery ?? "")
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(isUrl)
    .slice(0, 12);
  fields.Gallery = gallery.join("\n"); // empty clears it

  try {
    const id = await findVendorRecordIdBySlug(slug);
    if (!id) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }
    await updateAirtableRecord(id, fields);
    // Push the change to the public page immediately (otherwise ~60s ISR).
    revalidatePath(`/directory/${slug}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[oohsource] owner update failed:", e);
    return NextResponse.json(
      { error: "Couldn't save your changes. Please try again." },
      { status: 500 }
    );
  }
}
