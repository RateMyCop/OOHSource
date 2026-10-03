import { NextResponse } from "next/server";
import { emailConfigured } from "@/lib/email";
import { sendClaimBatch, CLAIM_OUTREACH_DEFAULT_LIMIT } from "@/lib/claim-outreach";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Weekly "claim your listing" drip. Vercel cron (see vercel.json) fires this
// every Monday; it sends the next batch of unemailed listings. Durable
// outreach-sent dedup means it never re-emails anyone, and it simply does
// nothing once the emailable pool is exhausted.
// Auth: Bearer CRON_SECRET (Vercel sends this automatically) OR x-admin-key.
export async function GET(req: Request) {
  const key = (req.headers.get("x-admin-key") || "").trim();
  const auth = (req.headers.get("authorization") || "").trim();
  const okAdmin = process.env.ADMIN_KEY && key === process.env.ADMIN_KEY.trim();
  const okCron =
    process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET.trim()}`;
  if (!okAdmin && !okCron) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!emailConfigured()) {
    return NextResponse.json({ ok: false, error: "RESEND_API_KEY not set" }, { status: 500 });
  }
  try {
    const result = await sendClaimBatch(CLAIM_OUTREACH_DEFAULT_LIMIT);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e).slice(0, 300) },
      { status: 500 }
    );
  }
}
