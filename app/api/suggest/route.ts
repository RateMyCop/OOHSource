import { NextResponse } from "next/server";
import { emailConfigured, sendReply } from "@/lib/email";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Public: suggest an edit to, or addition for, the Industry Media directory.
// Emails the suggestion to hello@oohsource.com (Reply-To the suggester).
export async function POST(req: Request) {
  let body: {
    subject?: unknown;
    message?: unknown;
    email?: unknown;
    company_url?: unknown; // honeypot
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
  }

  // Bots fill the hidden honeypot — silently accept without sending.
  if (String(body.company_url ?? "").trim()) {
    return NextResponse.json({ ok: true });
  }

  const subject = String(body.subject ?? "").trim().slice(0, 160);
  const message = String(body.message ?? "").trim().slice(0, 4000);
  const email = String(body.email ?? "").trim().slice(0, 160);
  if (message.length < 4) {
    return NextResponse.json(
      { ok: false, error: "message required" },
      { status: 400 }
    );
  }

  if (!emailConfigured()) {
    // Don't error out the user if email isn't wired; just no-op success.
    return NextResponse.json({ ok: true });
  }

  const html = `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; color: #1a1a1a;">
    <p><strong>Industry Media suggestion</strong></p>
    <p><strong>About:</strong> ${esc(subject) || "(general)"}</p>
    <p><strong>From:</strong> ${esc(email) || "(not provided)"}</p>
    <p><strong>Suggestion:</strong><br>${esc(message).replace(/\n/g, "<br>")}</p>
  </div>`;

  try {
    await sendReply(
      "hello@oohsource.com",
      `Publication suggestion${subject ? `: ${subject}` : ""}`,
      html,
      email || undefined
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 }
    );
  }
}
