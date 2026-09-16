import { NextResponse } from "next/server";
import { emailConfigured, sendContactMessage } from "@/lib/email";
import { airtableConfigured, createAirtableRecord } from "@/lib/airtable";

export const dynamic = "force-dynamic";

const CONTACT_TABLE = process.env.AIRTABLE_CONTACT_TABLE || "Contact";

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot — bots fill hidden fields; humans never see this one.
  if (typeof body.company_url === "string" && body.company_url.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const company = String(body.company ?? "").trim();
  const topic = String(body.topic ?? "").trim();
  const message = String(body.message ?? "").trim().slice(0, 5000);

  if (!name || !isEmail(email) || !message) {
    return NextResponse.json(
      { error: "Please add your name, a valid email, and a message." },
      { status: 400 }
    );
  }

  if (!emailConfigured()) {
    return NextResponse.json(
      { error: "Messaging is temporarily unavailable. Please email hello@oohsource.com directly." },
      { status: 503 }
    );
  }

  // Email is the primary delivery (notifies the owner inbox); failure fails the
  // request so the sender knows to retry.
  try {
    await sendContactMessage({ name, email, company, topic, message });
  } catch (e) {
    console.error("[oohsource] contact send failed:", e);
    return NextResponse.json(
      { error: "Something went wrong sending your message. Please try again." },
      { status: 500 }
    );
  }

  // Best-effort archive so nothing is lost even if the email is missed. The
  // Contact table may not exist yet — never fail the request on that.
  if (airtableConfigured()) {
    try {
      await createAirtableRecord(
        {
          Name: name,
          Email: email,
          Company: company,
          Topic: topic || "General",
          Message: message,
          Status: "New",
        },
        CONTACT_TABLE
      );
    } catch (e) {
      console.error("[oohsource] contact archive skipped:", e);
    }
  }

  return NextResponse.json({ ok: true });
}
