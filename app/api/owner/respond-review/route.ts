import { NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/auth";
import { ownedSlugsForEmail } from "@/lib/owner";
import { getReview, respondToReview } from "@/lib/reviews";

export const dynamic = "force-dynamic";

// Owner posts a public reply to one of their reviews.
export async function POST(req: Request) {
  const email = getSessionEmail();
  if (!email) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  let b: Record<string, unknown>;
  try {
    b = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const id = String(b.id || "").trim();
  const response = String(b.response || "").trim().slice(0, 2000);
  if (!id) return NextResponse.json({ error: "Missing review." }, { status: 400 });

  const review = await getReview(id);
  if (!review) return NextResponse.json({ error: "Review not found." }, { status: 404 });
  const owned = await ownedSlugsForEmail(email);
  if (!owned.includes(review.slug)) {
    return NextResponse.json({ error: "You don't have access to this review." }, { status: 403 });
  }

  await respondToReview(id, response);
  return NextResponse.json({ ok: true });
}
