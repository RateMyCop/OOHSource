import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { markUnsubscribed, recordBounce, recordComplaint } from "@/lib/outreach";

export const dynamic = "force-dynamic";

// Resend webhook (Svix-signed). Records bounces, spam complaints, and
// provider-level unsubscribes so the admin dashboard reflects the true
// deliverability picture — and suppresses those addresses from future sends.

function verify(secret: string, id: string, ts: string, sigHeader: string, body: string): boolean {
  try {
    const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
    const expected = crypto
      .createHmac("sha256", key)
      .update(`${id}.${ts}.${body}`)
      .digest("base64");
    const provided = sigHeader.split(" ").map((p) => p.split(",")[1]).filter(Boolean);
    return provided.some((p) => {
      const a = Buffer.from(p);
      const b = Buffer.from(expected);
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    });
  } catch {
    return false;
  }
}

function emailsOf(data: Record<string, unknown>): string[] {
  const to = (data?.to ?? data?.email ?? []) as unknown;
  const arr = Array.isArray(to) ? to : [to];
  return arr.map((x) => String(x || "").trim()).filter(Boolean);
}

export async function POST(req: Request) {
  const body = await req.text();
  const secret = (process.env.RESEND_WEBHOOK_SECRET || "").trim();

  // Verify when a secret is configured (recommended). Without one we still
  // accept so the integration works before the secret is wired up.
  if (secret) {
    const id = req.headers.get("svix-id") || "";
    const ts = req.headers.get("svix-timestamp") || "";
    const sig = req.headers.get("svix-signature") || "";
    if (!id || !ts || !sig || !verify(secret, id, ts, sig, body)) {
      return NextResponse.json({ ok: false, error: "bad signature" }, { status: 401 });
    }
  }

  let evt: { type?: string; data?: Record<string, unknown> };
  try {
    evt = JSON.parse(body);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const type = String(evt.type || "");
  const data = evt.data || {};
  const emails = emailsOf(data);
  try {
    for (const email of emails) {
      if (type === "email.bounced") {
        const reason =
          String(((data.bounce as Record<string, unknown>) || {}).type ?? "") ||
          String(data.reason ?? "") ||
          "bounced";
        await recordBounce(email, reason);
      } else if (type === "email.complained") {
        await recordComplaint(email);
      } else if (type === "email.unsubscribed") {
        await markUnsubscribed(email);
      }
    }
  } catch (e) {
    console.error("[resend webhook] processing failed:", e);
  }

  return NextResponse.json({ ok: true });
}
