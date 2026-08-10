import { Redis } from "@upstash/redis";

// Per-vendor analytics counters live in Redis (Upstash / Vercel KV). Airtable
// can't take a write per profile view, so view/click tallies go here instead.
//
// The connection env vars are injected automatically when you attach a Vercel
// KV (Upstash) store to the project. We accept either the KV_* names (Vercel's
// integration) or the UPSTASH_* names (Upstash marketplace), so this works
// regardless of which path was used to create the store.
const URL_ =
  process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const TOKEN_ =
  process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";

export function kvConfigured(): boolean {
  return Boolean(URL_ && TOKEN_);
}

let client: Redis | null = null;

// Returns a Redis client, or null when no store is configured yet. Callers
// treat null as "analytics off" and no-op, so the site works before KV exists.
export function kv(): Redis | null {
  if (!kvConfigured()) return null;
  if (!client) client = new Redis({ url: URL_, token: TOKEN_ });
  return client;
}
