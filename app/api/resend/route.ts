import { NextResponse } from "next/server";
import { fetchUnverifiedRecords, updateAirtableRecord } from "@/lib/airtable";
import { emailConfigured, sendVerificationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// Resend the confirmation link for a submission still awaiting email
// confirmation. Only ever emails an address that already has a pending
// "Unverified" submission, and only sends to that same address — so there is no
// way to use this to send mail to an arbitrary recipient.
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }
  if (!emailConfigured()) {
    return NextResponse.json({ ok: true, sent: false });
  }

  try {
    const records = await fetchUnverifiedRecords();
    const match = records
      .filter((r) => r.email.trim().toLowerCase() === email)
      .sort((a, b) => Date.parse(b.createdTime) - Date.parse(a.createdTime))[0];

    // Don't reveal whether an address has a pending submission.
    if (!match) return NextResponse.json({ ok: true, sent: false });

    let token = match.token;
    if (!token) {
      token = crypto.randomUUID();
      await updateAirtableRecord(match.id, { "Verify Token": token });
    }
    await sendVerificationEmail(match.email, match.company, token);
    return NextResponse.json({ ok: true, sent: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e).slice(0, 200) },
      { status: 500 }
    );
  }
}
