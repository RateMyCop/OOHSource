import { NextResponse } from "next/server";
import { emailConfigured, sendOutreachEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// Admin-only outreach sender. Sends the "you're listed — claim your profile"
// email from info@oohsource.com (not the transactional verify@ sender).
// Auth: header x-admin-key must match ADMIN_KEY.
//
// POST body: { to, company, slug }  — sends one email.
export async function POST(req: Request) {
  const key = (req.headers.get("x-admin-key") || "").trim();
  const configured = (process.env.ADMIN_KEY || "").trim();
  if (!configured || key !== configured) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!emailConfigured()) {
    return NextResponse.json({ ok: false, error: "email not configured" }, { status: 503 });
  }

  let body: { to?: unknown; company?: unknown; slug?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
  }
  const to = String(body.to ?? "").trim();
  const company = String(body.company ?? "").trim();
  const slug = String(body.slug ?? "").trim();
  if (!to || !company || !slug) {
    return NextResponse.json(
      { ok: false, error: "to, company, and slug are required" },
      { status: 400 }
    );
  }

  try {
    const sent = await sendOutreachEmail(to, company, slug);
    return NextResponse.json(
      sent ? { ok: true, sent: to } : { ok: true, skipped: "unsubscribed" }
    );
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 }
    );
  }
}
