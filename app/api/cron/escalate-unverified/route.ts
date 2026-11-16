import { NextResponse } from "next/server";
import { fetchUnverifiedRecords, updateAirtableRecord } from "@/lib/airtable";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// A submission sits as "Unverified" until the submitter clicks the emailed
// confirmation link. If that email is spam-filtered the listing would otherwise
// be stuck forever, so this sweep moves any Unverified record older than the
// threshold into "Pending Review" — the same status a confirmation sets — so it
// still goes through manual review and is never lost.
// Auth: Bearer CRON_SECRET (Vercel sends this automatically) OR x-admin-key.
const STALE_MS = 60 * 60 * 1000; // 1 hour

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
    const records = await fetchUnverifiedRecords();
    const cutoff = Date.now() - STALE_MS;
    const stale = records.filter((r) => {
      const t = Date.parse(r.createdTime);
      return Number.isFinite(t) && t < cutoff;
    });
    let escalated = 0;
    for (const r of stale) {
      await updateAirtableRecord(r.id, {
        Status: "Pending Review",
        "Verify Token": "",
      });
      escalated++;
    }
    return NextResponse.json({ ok: true, scanned: records.length, escalated });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e).slice(0, 300) },
      { status: 500 }
    );
  }
}
