import { NextResponse } from "next/server";
import { emailConfigured, sendBehavioralNudge } from "@/lib/email";

export const dynamic = "force-dynamic";

// Admin-only: fire a SAMPLE of the behavioral Featured upsell (the "you got
// traffic this week" email) to a chosen address, with sample view/contact
// numbers. Calls the real sender directly, so it's the exact email — the
// weekly cron's 30-day dedup lives in runBehavioralUpsell, not here, so this
// preview never burns a real recipient's slot. Suppression-aware.
// Body: { to, company?, views?, contacts? }
export async function POST(req: Request) {
  const key = (req.headers.get("x-admin-key") || "").trim();
  const configured = (process.env.ADMIN_KEY || "").trim();
  if (!configured || key !== configured) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!emailConfigured()) {
    return NextResponse.json({ ok: false, error: "email not configured" }, { status: 503 });
  }

  let body: { to?: unknown; company?: unknown; views?: unknown; contacts?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
  }

  const to = String(body.to ?? "").trim();
  const company = String(body.company ?? "Your Company").trim();
  const views = Number.isFinite(Number(body.views)) ? Number(body.views) : 47;
  const contacts = Number.isFinite(Number(body.contacts)) ? Number(body.contacts) : 5;
  if (!to || to.indexOf("@") < 1) {
    return NextResponse.json({ ok: false, error: "valid 'to' required" }, { status: 400 });
  }

  try {
    const sent = await sendBehavioralNudge(to, company, views, contacts);
    return NextResponse.json({
      ok: sent,
      to,
      company,
      views,
      contacts,
      note: sent
        ? "Delivered immediately (sample numbers; no dedup burned)."
        : "Not sent — address is suppressed/unsubscribed.",
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
