import { NextResponse } from "next/server";
import { kv } from "@/lib/kv";

export const dynamic = "force-dynamic";

// Admin-only: read the middleware's diagnostic request log and aggregate by IP
// so we can see who's crawling (IP, hit count, rate, sample UA, paths).
// DELETE clears the log.
function authed(req: Request): boolean {
  const key = (req.headers.get("x-admin-key") || "").trim();
  const configured = (process.env.ADMIN_KEY || "").trim();
  return Boolean(configured) && key === configured;
}

export async function GET(req: Request) {
  if (!authed(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const r = kv();
  if (!r) return NextResponse.json({ ok: false, error: "no kv" }, { status: 503 });

  const lines = ((await r.lrange("scrapelog", 0, 1500)) as string[]) || [];
  type Agg = { ip: string; hits: number; firstTs: number; lastTs: number; ua: string; paths: Set<string> };
  const byIp = new Map<string, Agg>();
  for (const l of lines) {
    const [tsStr, ip, ua, path] = String(l).split("|");
    const ts = Number(tsStr);
    if (!ip) continue;
    let a = byIp.get(ip);
    if (!a) {
      a = { ip, hits: 0, firstTs: ts, lastTs: ts, ua: ua || "", paths: new Set() };
      byIp.set(ip, a);
    }
    a.hits++;
    a.firstTs = Math.min(a.firstTs, ts);
    a.lastTs = Math.max(a.lastTs, ts);
    if (ua) a.ua = ua;
    if (path) a.paths.add(path);
  }
  const top = Array.from(byIp.values())
    .map((a) => {
      const mins = Math.max(1, (a.lastTs - a.firstTs) / 60000);
      return {
        ip: a.ip,
        hits: a.hits,
        perMin: Math.round((a.hits / mins) * 10) / 10,
        spanMin: Math.round(mins * 10) / 10,
        distinctPaths: a.paths.size,
        ua: a.ua,
        samplePaths: Array.from(a.paths).slice(0, 5),
      };
    })
    .sort((x, y) => y.hits - x.hits)
    .slice(0, 40);

  return NextResponse.json({ ok: true, totalLogged: lines.length, uniqueIps: byIp.size, top });
}

export async function DELETE(req: Request) {
  if (!authed(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const r = kv();
  if (r) await r.del("scrapelog");
  return NextResponse.json({ ok: true, cleared: true });
}
