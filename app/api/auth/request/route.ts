import { NextResponse } from "next/server";
import { authConfigured, makeLoginToken } from "@/lib/auth";
import { emailConfigured, sendLoginEmail } from "@/lib/email";
import { ownedSlugsForEmail } from "@/lib/owner";

export const dynamic = "force-dynamic";

// Request a magic sign-in link. To avoid revealing which emails own listings,
// the response is always a generic success — a link is only actually sent when
// the email has at least one authorized claim.
export async function POST(req: Request) {
  let body: { email?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const email = String(body?.email ?? "").trim().toLowerCase();
  if (!email || email.indexOf("@") < 1) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const generic = NextResponse.json({ ok: true });
  if (!authConfigured() || !emailConfigured()) return generic;

  try {
    const owned = await ownedSlugsForEmail(email);
    if (owned.length > 0) {
      await sendLoginEmail(email, makeLoginToken(email));
    }
  } catch (e) {
    console.error("[auth] request failed:", e);
  }
  return generic;
}
