import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  authConfigured,
  makeSessionToken,
  sessionCookieOptions,
} from "@/lib/auth";
import { kv } from "@/lib/kv";
import { ownedSlugsForEmail } from "@/lib/owner";

export const dynamic = "force-dynamic";

const MAX_ATTEMPTS = 5;

// Verify a 6-digit sign-in code and set the session cookie. Rate-limited to a
// handful of tries per code, and the code is single-use.
export async function POST(req: Request) {
  let body: { email?: unknown; code?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const email = String(body?.email ?? "").trim().toLowerCase();
  const code = String(body?.code ?? "").trim();
  if (!email || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Enter the 6-digit code from your email." }, { status: 400 });
  }
  if (!authConfigured()) {
    return NextResponse.json({ error: "Sign-in is temporarily unavailable." }, { status: 503 });
  }
  const r = kv();
  if (!r) {
    return NextResponse.json({ error: "Sign-in is temporarily unavailable." }, { status: 503 });
  }

  // Count attempts (short-lived) to block brute forcing.
  const attempts = await r.incr(`acn:${email}`);
  await r.expire(`acn:${email}`, 600);
  if (attempts > MAX_ATTEMPTS) {
    await r.del(`ac:${email}`);
    return NextResponse.json(
      { error: "Too many attempts. Request a new code." },
      { status: 429 }
    );
  }

  const stored = await r.get(`ac:${email}`);
  if (stored === null || stored === undefined) {
    return NextResponse.json({ error: "Your code expired. Request a new one." }, { status: 400 });
  }
  if (String(stored) !== code) {
    return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 400 });
  }

  // Valid — consume the code and confirm the email still owns a listing.
  await r.del(`ac:${email}`);
  await r.del(`acn:${email}`);
  const owned = await ownedSlugsForEmail(email);
  if (owned.length === 0) {
    return NextResponse.json(
      { error: "This email isn't linked to a confirmed listing." },
      { status: 403 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, makeSessionToken(email), sessionCookieOptions);
  return res;
}
