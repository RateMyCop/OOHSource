import { NextResponse } from "next/server";
import { emailConfigured, sendReply } from "@/lib/email";

// Admin-only: send a one-off reply from hello@oohsource.com (e.g. answering an
// inbound prospect email). Body: { to, subject, html, replyTo? }.
export async function POST(req: Request) {
  const key = (req.headers.get("x-admin-key") || "").trim();
  const configured = (process.env.ADMIN_KEY || "").trim();
  if (!configured || key !== configured) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!emailConfigured()) {
    return NextResponse.json({ ok: false, error: "email not configured" }, { status: 503 });
  }

  let body: { to?: unknown; subject?: unknown; html?: unknown; replyTo?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
  }

  const to = String(body.to ?? "").trim();
  const subject = String(body.subject ?? "").trim();
  const html = String(body.html ?? "").trim();
  const replyTo = body.replyTo ? String(body.replyTo).trim() : undefined;
  if (!to || !subject || !html) {
    return NextResponse.json(
      { ok: false, error: "to, subject, and html are required" },
      { status: 400 }
    );
  }

  try {
    await sendReply(to, subject, html, replyTo);
    return NextResponse.json({ ok: true, sent: to });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 }
    );
  }
}
