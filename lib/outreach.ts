import crypto from "node:crypto";
import { kv } from "./kv";
import { createAirtableRecord } from "./airtable";

const UNSUB_TABLE = process.env.AIRTABLE_UNSUB_TABLE || "Unsubscribes";

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
  const e = email.toLowerCase();
  const at = new Date().toISOString();
  // Suppression flag (value is the timestamp) + an index set for enumeration.
  await r.set(`unsub:${e}`, at);
  await r.sadd("unsub:index", e);
  // Durable, visible copy in Airtable. Best-effort: if the "Unsubscribes" table
  // doesn't exist yet, the opt-out still holds in KV — we just log and move on.
  try {
    await createAirtableRecord({ Email: e, Date: at, Source: "outreach" }, UNSUB_TABLE);
  } catch (err) {
    console.error("[unsub] Airtable mirror failed (create an 'Unsubscribes' table):", (err as Error).message);
  }
}

export async function resubscribe(email: string): Promise<void> {
  const r = kv();
  if (!r) return;
  const e = email.toLowerCase();
  await r.del(`unsub:${e}`);
  await r.srem("unsub:index", e);
}

// Record that a vendor clicked through from their outreach email (arrived with
// ?ref=email on their listing). Tracks visit count + last-seen per listing.
export async function recordEmailVisit(slug: string): Promise<void> {
  const r = kv();
  if (!r) return;
  const at = new Date().toISOString();
  await r.incr(`emvn:${slug}`);
  await r.set(`emvl:${slug}`, at);
  await r.sadd("emv:index", slug);
}

export async function listEmailVisits(): Promise<
  { slug: string; count: number; last: string | null }[]
> {
  const r = kv();
  if (!r) return [];
  const slugs = (await r.smembers("emv:index")) as string[];
  if (!slugs.length) return [];
  const counts = (await r.mget<(number | null)[]>(...slugs.map((s) => `emvn:${s}`))) || [];
  const lasts = (await r.mget<(string | null)[]>(...slugs.map((s) => `emvl:${s}`))) || [];
  return slugs
    .map((slug, i) => ({ slug, count: Number(counts[i] ?? 0), last: lasts[i] ?? null }))
    .sort((a, b) => (b.last || "").localeCompare(a.last || ""));
}

// All unsubscribed emails with the time they opted out (newest data from KV).
export async function listUnsubscribes(): Promise<{ email: string; at: string | null }[]> {
  const r = kv();
  if (!r) return [];
  const emails = (await r.smembers("unsub:index")) as string[];
  if (!emails.length) return [];
  const ats = (await r.mget<(string | null)[]>(...emails.map((e) => `unsub:${e}`))) || [];
  return emails
    .map((email, i) => ({ email, at: ats[i] ?? null }))
    .sort((a, b) => (b.at || "").localeCompare(a.at || ""));
}
