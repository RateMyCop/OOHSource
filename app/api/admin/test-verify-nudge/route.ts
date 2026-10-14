import { NextResponse } from "next/server";
import { emailConfigured, sendVerifiedUpgradeNudgeTest } from "@/lib/email";

export const dynamic = "force-dynamic";

// Admin-only: fire the verified→Featured upsell nudge to a chosen address
// immediately (the exact email a registrant gets ~2 days after confirming),
// bypassing the one-time gate so it can be previewed on demand.
// Body: { to, company? }
export async function POST(req: Request) {
  const key = (req.headers.get("x-admin-key") || "").trim();
  const configured = (process.env.ADMIN_KEY || "").trim();
  if (!configured || key !== configured) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!emailConfigured()) {
    return NextResponse.json({ ok: false, error: "email not configured" }, { status: 503 });
  }

  let body: { to?: unknown; company?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
  }

  const to = String(body.to ?? "").trim();
  const company = String(body.company ?? "Your Company").trim();
  if (!to || to.indexOf("@") < 1) {
    return NextResponse.json({ ok: false, error: "valid 'to' required" }, { status: 400 });
  }

  try {
    const sent = await sendVerifiedUpgradeNudgeTest(to, company);
    return NextResponse.json({
      ok: sent,
      to,
      company,
      note: sent ? "Delivered immediately (test; gate bypassed)." : "Not sent — address is suppressed/unsubscribed.",
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
