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
//     pass through UNLIMITED — AI visibility is untouched.
//   - A UA that CLAIMS a verifiable bot (Googlebot/GPTBot/…) from an IP not in
//     that provider's ranges is treated as a spoofer and rate-limited.
//   - Everyone else (humans + unknown bots) gets a generous per-IP rate limit;
//     only bulk scrapers blasting pages ever hit it.

const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const KV_TOK = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
const LIMIT = Number(process.env.SCRAPE_RATE_LIMIT || 80); // content-page loads per window per IP
const WINDOW = 60; // seconds

// Per-edge-isolate cache of the parsed verified-bot CIDRs (refreshed from KV).
let cidrCache: { at: number; parsed: ParsedCidr[] } = { at: 0, parsed: [] };

async function getCidrs(): Promise<ParsedCidr[]> {
  if (cidrCache.parsed.length && Date.now() - cidrCache.at < 600000) return cidrCache.parsed;
  if (!KV_URL) return cidrCache.parsed;
  try {
    const r = await fetch(`${KV_URL}/get/botips:v1`, {
      headers: { Authorization: `Bearer ${KV_TOK}` },
    });
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
    if (arr.length) cidrCache = { at: Date.now(), parsed: parseCidrs(arr) };
  } catch {
    /* keep stale cache */
  }
  return cidrCache.parsed;
}

async function hit(ip: string, ua: string, path: string): Promise<number> {
  if (!KV_URL) return 0;
  // Fixed window: key carries the window bucket so a plain EXPIRE is enough.
  const bucket = Math.floor(Date.now() / (WINDOW * 1000));
  const key = `rl:${ip}:${bucket}`;
  // Diagnostic log line (temporary): ts | ip | ua(80) | path — capped list.
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

  const cidrs = await getCidrs();

  // 1) Verified by published IP → always allow (spoof-proof).
  if (cidrs.length && ipInParsed(ip, cidrs)) return NextResponse.next();

  if (cidrs.length === 0) {
    // IP list not loaded yet → v1 fallback: trust any known good-bot UA.
    if (VERIFIABLE_BOT_UA.test(ua) || UNVERIFIABLE_BOT_UA.test(ua)) return NextResponse.next();
  } else {
    // v2: UA claims a verifiable bot but IP didn't match → spoofer → rate-limit.
    // Bots without published IP lists are trusted by UA.
    if (!VERIFIABLE_BOT_UA.test(ua) && UNVERIFIABLE_BOT_UA.test(ua)) {
      return NextResponse.next();
    }
  }

  // 2) Rate-limit everyone else (and log for diagnostics).
  const count = await hit(ip, ua, req.nextUrl.pathname);
  if (count > LIMIT) {
    return new NextResponse("Too many requests — please slow down.", {
      status: 429,
      headers: { "Retry-After": String(WINDOW), "Cache-Control": "no-store" },
    });
  }
  return NextResponse.next();
}

// Run on page routes only — skip _next, api, and any file with an extension
// (static assets, robots.txt, sitemap.xml, images, logos).
export const config = {
  matcher: ["/((?!_next/|api/|.*\\.).*)"],
};
