import crypto from "node:crypto";
import { cookies } from "next/headers";

// Lightweight, dependency-free session auth for claimed-listing owners.
// Magic-link sign-in: no passwords are ever handled. Tokens are HMAC-signed
// payloads; the session lives in an httpOnly cookie.
//
// Signing secret: a dedicated AUTH_SECRET if set, otherwise the existing
// ADMIN_KEY (already a server-only secret) so no new env var is required.
const SECRET = (process.env.AUTH_SECRET || process.env.ADMIN_KEY || "").trim();

export const SESSION_COOKIE = "oohs_session";
export const LOGIN_TTL = 20 * 60; // magic link valid 20 min
const SESSION_TTL = 60 * 60 * 24 * 30; // session cookie valid 30 days

export function authConfigured(): boolean {
  return Boolean(SECRET);
}

type Payload = { e: string; exp: number; jti?: string; t: "login" | "session" };

function sign(data: string): string {
  return crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
}

function makeToken(p: Payload): string {
  const body = Buffer.from(JSON.stringify(p)).toString("base64url");
  return `${body}.${sign(body)}`;
}

// Verify signature + expiry; returns the payload or null.
export function readToken(token: string): Payload | null {
  if (!SECRET || !token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8")
    ) as Payload;
    if (!p || typeof p.e !== "string" || typeof p.exp !== "number") return null;
    if (Date.now() / 1000 > p.exp) return null;
    return p;
  } catch {
    return null;
  }
}

export function makeLoginToken(email: string): string {
  return makeToken({
    e: email.toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + LOGIN_TTL,
    jti: crypto.randomUUID(),
    t: "login",
  });
}

export function makeSessionToken(email: string): string {
  return makeToken({
    e: email.toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL,
    t: "session",
  });
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_TTL,
};

// Reads the current signed-in owner's email from the session cookie, or null.
export function getSessionEmail(): string | null {
  const raw = cookies().get(SESSION_COOKIE)?.value || "";
  const p = readToken(raw);
  return p && p.t === "session" ? p.e : null;
}
