import { NextResponse } from "next/server";
import { getVendorBySlug } from "@/lib/vendors";
import { createLead } from "@/lib/leads";
import { sendLeadNotification, emailConfigured } from "@/lib/email";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Public "Contact this company" inquiry. Stored for the owner's Leads tab and
// emailed to the company's contact address when one is on file.
export async function POST(req: Request) {
  let b: Record<string, unknown>;
  try {
    b = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const slug = String(b.slug || "").trim();
  const name = String(b.name || "").trim().slice(0, 80);
  const email = String(b.email || "").trim().toLowerCase();
  const company = String(b.company || "").trim().slice(0, 120);
  const message = String(b.message || "").trim().slice(0, 4000);

  if (!slug || !name || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Please add your name and a valid email." }, { status: 400 });
  }
  if (message.length < 10) {
    return NextResponse.json({ error: "Please include a short message." }, { status: 400 });
  }

  const vendor = await getVendorBySlug(slug);
  if (!vendor) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  const lead = await createLead({ slug, name, email, company, message });
  if (!lead) {
    return NextResponse.json({ error: "Inquiries aren't available right now." }, { status: 503 });
  }

  // Best-effort notify the company's public contact address.
  if (vendor.contactEmail && emailConfigured()) {
    try {
      await sendLeadNotification(vendor.contactEmail, vendor.name, slug, { name, email, company, message });
    } catch (e) {
      console.error("[oohsource] lead notify failed:", e);
    }
  }

  return NextResponse.json({ ok: true });
}
