import { NextResponse } from "next/server";
import { kv, kvConfigured } from "@/lib/kv";

// Per-vendor event tracking.
//
//   POST /api/track   { slug, e }   e ∈ view | website | email
//     Fire-and-forget beacon from the browser. Increments an all-time counter
//     and a per-UTC-day counter (kept ~120 days) so we can show trends and
//     build weekly digests. Always returns 204 — tracking must never surface
//     an error to the visitor, and no-ops silently when KV isn't configured.
//
//   GET /api/track?slug=X&days=N    (x-admin-key)
//     Returns totals + a per-event daily series for the dashboard / digests.

export const dynamic = "force-dynamic";

const EVENTS = ["view", "website", "email"] as const;
type Ev = (typeof EVENTS)[number];
const EVENT_SET = new Set<string>(EVENTS);
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,79}$/;
const DAY_TTL = 60 * 60 * 24 * 120; // 120 days

function dayKey(offset = 0): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - offset);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

const noContent = () => new NextResponse(null, { status: 204 });

export async function POST(req: Request) {
  let body: { slug?: unknown; e?: unknown };
  try {
    body = await req.json();
  } catch {
    return noContent();
  }
  const slug = String(body?.slug ?? "").trim();
  const e = String(body?.e ?? "").trim();
  if (!SLUG_RE.test(slug) || !EVENT_SET.has(e)) return noContent();

  const r = kv();
  if (!r) return noContent(); // KV not attached yet — accept and drop.

  try {
    const daily = `t:${slug}:${e}:${dayKey()}`;
    const p = r.pipeline();
    p.incr(`t:${slug}:${e}`); // all-time total
    p.incr(daily); // today
    p.expire(daily, DAY_TTL);
    await p.exec();
  } catch (err) {
    console.error("[track] write failed:", err);
  }
  return noContent();
}

export async function GET(req: Request) {
  const key = (req.headers.get("x-admin-key") || "").trim();
  const configured = (process.env.ADMIN_KEY || "").trim();
  if (!configured || key !== configured) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!kvConfigured()) {
    return NextResponse.json(
      { ok: false, error: "KV not configured" },
      { status: 503 }
    );
  }
  const url = new URL(req.url);
  const slug = (url.searchParams.get("slug") || "").trim();
  const days = Math.min(Math.max(Number(url.searchParams.get("days") || "30"), 1), 120);
  if (!SLUG_RE.test(slug)) {
    return NextResponse.json({ ok: false, error: "bad slug" }, { status: 400 });
  }

  const r = kv()!;
  const dates = Array.from({ length: days }, (_, i) => dayKey(days - 1 - i)); // oldest → newest
  const totalKeys = EVENTS.map((e) => `t:${slug}:${e}`);
  const dailyKeys = EVENTS.flatMap((e) => dates.map((d) => `t:${slug}:${e}:${d}`));

  const [totalVals, dailyVals] = await Promise.all([
    totalKeys.length ? r.mget<(number | null)[]>(...totalKeys) : Promise.resolve([]),
    dailyKeys.length ? r.mget<(number | null)[]>(...dailyKeys) : Promise.resolve([]),
  ]);

  const totals: Record<Ev, number> = { view: 0, website: 0, email: 0 };
  EVENTS.forEach((e, i) => (totals[e] = Number(totalVals[i] ?? 0)));

  const series: Record<Ev, number[]> = { view: [], website: [], email: [] };
  EVENTS.forEach((e, ei) => {
    series[e] = dates.map((_, di) => Number(dailyVals[ei * days + di] ?? 0));
  });

  return NextResponse.json({ ok: true, slug, days, dates, totals, series });
}
