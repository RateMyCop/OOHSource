import { NextResponse } from "next/server";
import { fetchAllBotCidrs, fetchDatacenterCidrs } from "@/lib/bot-ips";
import { kv } from "@/lib/kv";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Refreshes the verified-crawler IP allow-list (Google, Bing, OpenAI, Perplexity)
// into KV so the anti-scrape middleware can verify good bots by IP (spoof-proof).
// Runs daily (see vercel.json); also callable manually with x-admin-key.
// Auth: Bearer CRON_SECRET (Vercel) OR x-admin-key.
export async function GET(req: Request) {
  const auth = (req.headers.get("authorization") || "").trim();
  const key = (req.headers.get("x-admin-key") || "").trim();
  const okCron =
    Boolean(process.env.CRON_SECRET) && auth === `Bearer ${(process.env.CRON_SECRET || "").trim()}`;
  const okKey = Boolean(process.env.ADMIN_KEY) && key === (process.env.ADMIN_KEY || "").trim();
  if (!okCron && !okKey) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const [cidrs, dc] = await Promise.all([fetchAllBotCidrs(), fetchDatacenterCidrs()]);
    const r = kv();
    if (r && cidrs.length) {
      await r.set("botips:v1", JSON.stringify(cidrs));
      await r.set("botips:v1:at", new Date().toISOString());
    }
    if (r && dc.length) {
      await r.set("dcips:v1", JSON.stringify(dc));
      await r.set("dcips:v1:at", new Date().toISOString());
    }
    return NextResponse.json({
      ok: true,
      botCount: cidrs.length,
      dcCount: dc.length,
      sample: cidrs.slice(0, 4),
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e).slice(0, 300) }, { status: 500 });
  }
}
