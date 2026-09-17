import { NextResponse } from "next/server";
import { refreshVendorSnapshot } from "@/lib/vendors";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Refreshes the KV vendor snapshot from Airtable so page renders never have to
// paginate Airtable themselves (see lib/vendors.ts). Runs on a Vercel cron;
// also callable manually with the admin key. Auth: Bearer CRON_SECRET (Vercel
// sends this automatically) OR x-admin-key.
export async function GET(req: Request) {
  const key = (req.headers.get("x-admin-key") || "").trim();
  const auth = (req.headers.get("authorization") || "").trim();
  const okAdmin = process.env.ADMIN_KEY && key === process.env.ADMIN_KEY.trim();
  const okCron =
    process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET.trim()}`;
  if (!okAdmin && !okCron) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const count = await refreshVendorSnapshot();
    return NextResponse.json({ ok: true, count });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e).slice(0, 300) },
      { status: 500 }
    );
  }
}
