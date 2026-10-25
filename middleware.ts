import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  parseCidrs,
  ipInParsed,
  VERIFIABLE_BOT_UA,
  UNVERIFIABLE_BOT_UA,
  type ParsedCidr,
} from "@/lib/bot-ips";

// Anti-scrape gate.
//   - Verified AI/search crawlers (by published IP, or UA for those w/o IP lists)
//     pass UNLIMITED — AI visibility is untouched.
//   - A UA claiming a verifiable bot (Googlebot/GPTBot/…) from an IP not in that
//     provider's ranges = spoofer → rate-limited.
//   - Datacenter/cloud IPs (AWS/GCP/DO/Oracle) get a STRICT limit — real humans
//     and AI crawlers don't browse from raw datacenter IPs; scrapers do.
//   - Everyone else (residential) gets a generous per-IP limit.

const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const KV_TOK = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
const LIMIT = Number(process.env.SCRAPE_RATE_LIMIT || 80); // residential, per IP / window
const DC_LIMIT = Number(process.env.DC_RATE_LIMIT || 10); // datacenter, per IP / window
const WINDOW = 60; // seconds

type Cache = { at: number; parsed: ParsedCidr[] };
const botCache: Cache = { at: 0, parsed: [] };
const dcCache: Cache = { at: 0, parsed: [] };

async function loadCidrs(key: string, cache: Cache): Promise<ParsedCidr[]> {
  if (cache.parsed.length && Date.now() - cache.at < 600000) return cache.parsed;
  if (!KV_URL) return cache.parsed;
  try {
    const r = await fetch(`${KV_URL}/get/${key}`, { headers: { Authorization: `Bearer ${KV_TOK}` } });
    const d = (await r.json()) as { result?: unknown };
    let v: unknown = d.result;
    if (typeof v === "string") {
      try {
        v = JSON.parse(v);
      } catch {
        v = [];
      }
    }
    const arr = Array.isArray(v) ? (v as string[]) : [];
    if (arr.length) {
      cache.at = Date.now();
      cache.parsed = parseCidrs(arr);
    }
  } catch {
    /* keep stale cache */
  }
  return cache.parsed;
}

async function hit(ip: string, ua: string, path: string): Promise<number> {
  if (!KV_URL) return 0;
  const bucket = Math.floor(Date.now() / (WINDOW * 1000));
  const key = `rl:${ip}:${bucket}`;
  const line = `${Date.now()}|${ip}|${ua.slice(0, 80).replace(/[|\n]/g, " ")}|${path}`;
  try {
    const r = await fetch(`${KV_URL}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${KV_TOK}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, String(WINDOW)],
        ["LPUSH", "scrapelog", line],
        ["LTRIM", "scrapelog", "0", "1500"],
      ]),
    });
    const d = (await r.json()) as Array<{ result?: number }>;
    return Array.isArray(d) ? Number(d[0]?.result ?? 0) : 0;
  } catch {
    return 0; // never block on a KV hiccup
  }
}

export async function middleware(req: NextRequest) {
  const ua = req.headers.get("user-agent") || "";
  const ip =
    (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "0.0.0.0";

  const bot = await loadCidrs("botips:v1", botCache);

  // 1) Verified good bot by published IP → always allow (spoof-proof).
  if (bot.length && ipInParsed(ip, bot)) return NextResponse.next();

  // 2) UA-based bot handling.
  if (bot.length === 0) {
    // IP list not loaded → trust any known good-bot UA (v1 fallback).
    if (VERIFIABLE_BOT_UA.test(ua) || UNVERIFIABLE_BOT_UA.test(ua)) return NextResponse.next();
  } else {
    // Bots without published IPs are trusted by UA (incl. from cloud).
    // A UA claiming a verifiable bot but not IP-verified = spoofer → falls through.
    if (!VERIFIABLE_BOT_UA.test(ua) && UNVERIFIABLE_BOT_UA.test(ua)) {
      return NextResponse.next();
    }
  }

  // 3) Datacenter IPs get a strict limit; residential gets the generous one.
  const dc = await loadCidrs("dcips:v1", dcCache);
  const isDc = dc.length ? ipInParsed(ip, dc) : false;
  const limit = isDc ? DC_LIMIT : LIMIT;

  const count = await hit(ip, ua, req.nextUrl.pathname);
  if (count > limit) {
    return new NextResponse("Too many requests — please slow down.", {
      status: 429,
      headers: { "Retry-After": String(WINDOW), "Cache-Control": "no-store" },
    });
  }
  return NextResponse.next();
}

// Page routes only — skip _next, api, and any file with an extension.
export const config = {
  matcher: ["/((?!_next/|api/|.*\\.).*)"],
};
