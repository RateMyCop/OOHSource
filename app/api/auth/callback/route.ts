import { NextResponse } from "next/server";
import {
  LOGIN_TTL,
  SESSION_COOKIE,
  makeSessionToken,
  readToken,
  sessionCookieOptions,
} from "@/lib/auth";
import { consumeOnce } from "@/lib/stats";

export const dynamic = "force-dynamic";

// Magic-link landing. Verifies the one-time login token, enforces single use
// (via KV when available), and sets the session cookie.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  const fail = () => NextResponse.redirect(new URL("/login?error=1", url.origin));

  const p = readToken(token);
  if (!p || p.t !== "login" || !p.jti) return fail();

  const fresh = await consumeOnce(p.jti, LOGIN_TTL);
  if (!fresh) return fail(); // already used

  const res = NextResponse.redirect(new URL("/dashboard", url.origin));
  res.cookies.set(SESSION_COOKIE, makeSessionToken(p.e), sessionCookieOptions);
  return res;
}
