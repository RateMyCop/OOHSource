import { NextResponse } from "next/server";
import { runBehavioralUpsell } from "@/lib/behavioral-upsell";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Weekly behavioral Featured upsell. Emails owners of FREE listings that got
// real traffic in the last 7 days, leading with their numbers. At most one
// nudge per owner / 30 days; suppression-aware; only touches free listings.
// Runs on a Vercel cron (see vercel.json); also callable manually.
// Auth: Bearer CRON_SECRET (Vercel sends this) OR x-admin-key.
// Query: ?dry=1 (preview, no send, no dedup write), ?email=<addr> (one owner),
//        ?minViews=N, ?minContacts=N (tune the activity bar).
export async function GET(req: Request) {
  const key = (req.headers.get("x-admin-key") || "").trim();
  const auth = (req.headers.get("authorization") || "").trim();
  const okKey = Boolean(process.env.ADMIN_KEY) && key === (process.env.ADMIN_KEY || "").trim();
  const okCron =
    Boolean(process.env.CRON_SECRET) && auth === `Bearer ${(process.env.CRON_SECRET || "").trim()}`;
  if (!okKey && !okCron) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const dry = url.searchParams.get("dry") === "1";
  const onlyEmail = url.searchParams.get("email") || undefined;
  const minViews = url.searchParams.has("minViews")
    ? Number(url.searchParams.get("minViews"))
    : undefined;
  const minContacts = url.searchParams.has("minContacts")
    ? Number(url.searchParams.get("minContacts"))
    : undefined;

  try {
    const result = await runBehavioralUpsell({ dry, onlyEmail, minViews, minContacts });
    return NextResponse.json({ ok: true, dry, ...result });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e).slice(0, 300) },
      { status: 500 }
    );
  }
}
