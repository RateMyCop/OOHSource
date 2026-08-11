import { NextResponse } from "next/server";
import { recordEmailVisit } from "@/lib/outreach";

export const dynamic = "force-dynamic";

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,79}$/;

// Fire-and-forget beacon: a vendor arrived on their listing from the outreach
// email (?ref=email). Records the click-through. Always 204, never throws.
export async function POST(req: Request) {
  let body: { slug?: unknown };
  try {
    body = await req.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }
  const slug = String(body?.slug ?? "").trim();
  if (SLUG_RE.test(slug)) {
    try {
      await recordEmailVisit(slug);
    } catch (e) {
      console.error("[em-visit] failed:", e);
    }
  }
  return new NextResponse(null, { status: 204 });
}
