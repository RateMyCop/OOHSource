import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { authConfigured } from "@/lib/auth";
import { kv } from "@/lib/kv";
import { emailConfigured, sendLoginCode } from "@/lib/email";
import { ownedSlugsForEmail } from "@/lib/owner";

export const dynamic = "force-dynamic";

// Request a 6-digit sign-in code. To avoid revealing which emails own listings,
// the response is always a generic success — a code is only actually sent when
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
      const r = kv();
      if (r) {
        const code = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
        // Store the code for 10 minutes and reset the attempt counter.
        await r.set(`ac:${email}`, code, { ex: 600 });
        await r.del(`acn:${email}`);
        await sendLoginCode(email, code);
      }
    }
  } catch (e) {
    console.error("[auth] code request failed:", e);
  }
  return generic;
}
