import { NextResponse } from "next/server";
import { recordEmailVisit } from "@/lib/outreach";

export const dynamic = "force-dynamic";

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,79}$/;
const SOURCE_RE = /^[a-z0-9-]{1,32}$/;

// Fire-and-forget beacon: a vendor arrived on their listing from an outreach
// email (?ref=<source>). Records the click-through, attributed to the source
// (e.g. "email" or "badge-email"). Always 204, never throws.
export async function POST(req: Request) {
  let body: { slug?: unknown; source?: unknown };
  try {
    body = await req.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }
  const slug = String(body?.slug ?? "").trim();
  const source = String(body?.source ?? "email").trim();
  if (SLUG_RE.test(slug)) {
    try {
      await recordEmailVisit(slug, SOURCE_RE.test(source) ? source : "email");
    } catch (e) {
      console.error("[em-visit] failed:", e);
    }
  }
  return new NextResponse(null, { status: 204 });
}
