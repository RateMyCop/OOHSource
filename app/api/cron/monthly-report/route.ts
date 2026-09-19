import { NextResponse } from "next/server";
import { runMonthlyReports } from "@/lib/reports";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Monthly owner performance recap. Runs on the 1st (see vercel.json), and is
// also callable manually. Auth: Bearer CRON_SECRET (Vercel sends this) OR
// x-admin-key. Query: ?dry=1 (preview, no send, no snapshot), ?email=<addr>
// (only that owner — handy for testing).
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

  const result = await runMonthlyReports({ dry, onlyEmail });
  return NextResponse.json({ ok: true, ...result });
}
