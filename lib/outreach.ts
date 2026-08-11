import crypto from "node:crypto";
import { kv } from "./kv";

// Unsubscribe handling for outreach email. A signed token encodes the email so
// nothing sensitive sits in the URL and nobody can unsubscribe a third party.
// The suppression list lives in KV; the sender checks it before every send.
const SECRET = (process.env.AUTH_SECRET || process.env.ADMIN_KEY || "").trim();

export function makeUnsubToken(email: string): string {
  const body = Buffer.from(JSON.stringify({ e: email.toLowerCase() })).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function readUnsubToken(token: string): string | null {
  if (!SECRET || !token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    return typeof p.e === "string" ? p.e : null;
  } catch {
    return null;
  }
}

export async function isUnsubscribed(email: string): Promise<boolean> {
  const r = kv();
  if (!r) return false;
  return Boolean(await r.get(`unsub:${email.toLowerCase()}`));
}

export async function markUnsubscribed(email: string): Promise<void> {
  const r = kv();
  if (!r) return;
  await r.set(`unsub:${email.toLowerCase()}`, "1");
}
