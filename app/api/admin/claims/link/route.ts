import { NextResponse } from "next/server";
import { createAirtableRecord } from "@/lib/airtable";
import { getVendorBySlug } from "@/lib/vendors";

export const dynamic = "force-dynamic";

const CLAIMS_TABLE = process.env.AIRTABLE_CLAIMS_TABLE || "Claims";

// Admin-key: link a listing to an owner email by creating a pre-Approved claim
// (owner dashboard access), bypassing the email-verify flow. Useful for owners
// on generic inboxes, and for internal testing.
// POST { email, slug }  headers: x-admin-key
export async function POST(req: Request) {
  const key = (req.headers.get("x-admin-key") || "").trim();
  const configured = (process.env.ADMIN_KEY || "").trim();
  if (!configured || key !== configured) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: { email?: string; slug?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }
  const email = String(body.email || "").trim().toLowerCase();
  const slug = String(body.slug || "").trim();
  if (!email || !slug) {
    return NextResponse.json({ ok: false, error: "email and slug required" }, { status: 400 });
  }

  const vendor = await getVendorBySlug(slug);
  if (!vendor) {
    return NextResponse.json({ ok: false, error: "vendor not found" }, { status: 404 });
  }

  try {
    const id = await createAirtableRecord(
      {
        Company: vendor.name,
        "Vendor Slug": vendor.slug,
        "Claimant Email": email,
        "Domain Match": "No",
        Status: "Approved",
        Note: "Linked via admin (owner dashboard access)",
      },
      CLAIMS_TABLE
    );
    return NextResponse.json({ ok: true, id, company: vendor.name, slug: vendor.slug, email });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
