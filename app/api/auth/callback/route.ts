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

// Completes sign-in. Driven by POST (the button on /login/verify) so that email
// security scanners pre-fetching the link can't consume the one-time token.
export async function POST(req: Request) {
  const origin = new URL(req.url).origin;
  const fail = () =>
    NextResponse.redirect(new URL("/login?error=1", origin), { status: 303 });

  let token = "";
  try {
    const form = await req.formData();
    token = String(form.get("token") || "");
  } catch {
    return fail();
  }

  const p = readToken(token);
  if (!p || p.t !== "login" || !p.jti) return fail();

  const fresh = await consumeOnce(p.jti, LOGIN_TTL);
  if (!fresh) return fail(); // already used

  const res = NextResponse.redirect(new URL("/dashboard", origin), { status: 303 });
  res.cookies.set(SESSION_COOKIE, makeSessionToken(p.e), sessionCookieOptions);
  return res;
}

// Fallback for any direct GET (e.g. an old-style link): send to the confirm
// page rather than acting, keeping the flow scanner-safe.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  return NextResponse.redirect(
    new URL(`/login/verify?token=${encodeURIComponent(token)}`, url.origin)
  );
}
