import { NextResponse } from "next/server";
import { markUnsubscribed, readUnsubToken } from "@/lib/outreach";

export const dynamic = "force-dynamic";

// Unsubscribe endpoint.
//
// GET never changes state — email security scanners pre-fetch links, and a
// GET that unsubscribed would silently opt people out. So GET just forwards to
// a confirmation page with a button.
//
// POST performs the unsubscribe. It's reached two ways, both deliberate:
//   - the "Confirm unsubscribe" button on /unsubscribe (a browser form), and
//   - a mail client's native one-click button (RFC 8058 List-Unsubscribe-Post).
export async function GET(req: Request) {
  const url = new URL(req.url);
  const t = url.searchParams.get("t") || "";
  return NextResponse.redirect(
    new URL(`/unsubscribe?t=${encodeURIComponent(t)}`, url.origin)
  );
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  let token = url.searchParams.get("t") || "";
  if (!token) {
    try {
      const form = await req.formData();
      token = String(form.get("t") || "");
    } catch {
      /* no form body (e.g. one-click) — token stays from query */
    }
  }
  const email = readUnsubToken(token);
  if (email) await markUnsubscribed(email);

  // Browser form submit → show the styled confirmation page. Non-browser
  // one-click clients just need a success status.
  const wantsHtml = (req.headers.get("accept") || "").includes("text/html");
  if (wantsHtml) {
    return NextResponse.redirect(
      new URL(`/unsubscribe?done=${email ? "1" : "0"}`, url.origin),
      { status: 303 }
    );
  }
  return new NextResponse(null, { status: 200 });
}
