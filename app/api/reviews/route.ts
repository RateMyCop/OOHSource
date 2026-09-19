import { NextResponse } from "next/server";
import { getVendorBySlug } from "@/lib/vendors";
import { createReview } from "@/lib/reviews";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Public review submission. Lands as "pending" for admin moderation.
export async function POST(req: Request) {
  let b: Record<string, unknown>;
  try {
    b = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const slug = String(b.slug || "").trim();
  const name = String(b.name || "").trim().slice(0, 80);
  const company = String(b.company || "").trim().slice(0, 120);
  const email = String(b.email || "").trim().toLowerCase();
  const title = String(b.title || "").trim().slice(0, 120);
  const body = String(b.body || "").trim().slice(0, 4000);
  const rating = Math.round(Number(b.rating));
  const source = String(b.source || "") === "invited" ? "invited" : "direct";

  if (!slug || !name || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Please add your name and a valid email." }, { status: 400 });
  }
  if (!(rating >= 1 && rating <= 5)) {
    return NextResponse.json({ error: "Please choose a rating from 1 to 5." }, { status: 400 });
  }
  if (body.length < 20) {
    return NextResponse.json({ error: "Please write at least a sentence about your experience." }, { status: 400 });
  }

  const vendor = await getVendorBySlug(slug);
  if (!vendor) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  const review = await createReview({ slug, name, company, email, rating, title, body, source });
  if (!review) {
    return NextResponse.json({ error: "Reviews aren't available right now." }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
