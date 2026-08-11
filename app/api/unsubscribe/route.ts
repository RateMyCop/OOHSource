import { NextResponse } from "next/server";
import { markUnsubscribed, readUnsubToken } from "@/lib/outreach";

export const dynamic = "force-dynamic";

// One-click unsubscribe (RFC 8058). Mail clients POST here; humans GET here by
// clicking the footer link. Both add the address to the suppression list.
export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get("t") || "";
  const email = readUnsubToken(token);
  if (email) await markUnsubscribed(email);
  return new NextResponse(null, { status: 200 });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = readUnsubToken(url.searchParams.get("t") || "");
  if (email) await markUnsubscribed(email);
  return NextResponse.redirect(
    new URL(`/unsubscribe?ok=${email ? "1" : "0"}`, url.origin)
  );
}
