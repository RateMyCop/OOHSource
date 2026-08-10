import { kv } from "./kv";

// Per-vendor analytics counters in KV (see lib/kv.ts). Shared by the /api/track
// beacon, the owner dashboard, and (later) the weekly digest job.

export const EVENTS = ["view", "website", "email"] as const;
export type Ev = (typeof EVENTS)[number];
export const EVENT_SET = new Set<string>(EVENTS);
const DAY_TTL = 60 * 60 * 24 * 120; // keep per-day counters 120 days

export function dayKey(offset = 0): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - offset);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

// Increment the all-time and today counters for an event. No-ops without KV.
export async function recordEvent(slug: string, e: Ev): Promise<void> {
  const r = kv();
  if (!r) return;
  const daily = `t:${slug}:${e}:${dayKey()}`;
  const p = r.pipeline();
  p.incr(`t:${slug}:${e}`);
  p.incr(daily);
  p.expire(daily, DAY_TTL);
  await p.exec();
}

export type Stats = {
  dates: string[];
  totals: Record<Ev, number>;
  series: Record<Ev, number[]>;
};

// All-time totals plus a per-day series (oldest → newest) for the last `days`.
export async function getStats(slug: string, days: number): Promise<Stats> {
  const dates = Array.from({ length: days }, (_, i) => dayKey(days - 1 - i));
  const empty: Stats = {
    dates,
    totals: { view: 0, website: 0, email: 0 },
    series: { view: [], website: [], email: [] },
  };
  const r = kv();
  if (!r) return empty;

  const totalKeys = EVENTS.map((e) => `t:${slug}:${e}`);
  const dailyKeys = EVENTS.flatMap((e) => dates.map((d) => `t:${slug}:${e}:${d}`));
  const [totalVals, dailyVals] = await Promise.all([
    r.mget<(number | null)[]>(...totalKeys),
    dailyKeys.length
      ? r.mget<(number | null)[]>(...dailyKeys)
      : Promise.resolve([] as (number | null)[]),
  ]);

  const totals: Record<Ev, number> = { view: 0, website: 0, email: 0 };
  EVENTS.forEach((e, i) => (totals[e] = Number(totalVals[i] ?? 0)));
  const series: Record<Ev, number[]> = { view: [], website: [], email: [] };
  EVENTS.forEach((e, ei) => {
    series[e] = dates.map((_, di) => Number(dailyVals[ei * days + di] ?? 0));
  });
  return { dates, totals, series };
}

// Atomically mark a one-time token id as used. Returns true the first time,
// false on replay. Without KV it can't dedupe, so it allows (fails open).
export async function consumeOnce(jti: string, ttlSec: number): Promise<boolean> {
  const r = kv();
  if (!r) return true;
  const ok = await r.set(`used:${jti}`, "1", { nx: true, ex: ttlSec });
  return ok === "OK";
}
