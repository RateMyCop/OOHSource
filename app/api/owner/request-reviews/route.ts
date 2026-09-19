import { NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/auth";
import { ownedSlugsForEmail } from "@/lib/owner";
import { getVendorBySlug } from "@/lib/vendors";
import { sendReviewInvite, emailConfigured } from "@/lib/email";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Owner sends review invites to their clients. Session-gated to an owner of the
// listing. Up to 20 addresses per call, throttled under Resend's rate limit.
export async function POST(req: Request) {
  const email = getSessionEmail();
  if (!email) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  if (!emailConfigured()) return NextResponse.json({ error: "Email isn't configured." }, { status: 503 });

  let b: Record<string, unknown>;
  try {
    b = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const slug = String(b.slug || "").trim();
  const owned = await ownedSlugsForEmail(email);
  if (!slug || !owned.includes(slug)) {
    return NextResponse.json({ error: "You don't have access to this listing." }, { status: 403 });
  }
  const vendor = await getVendorBySlug(slug);
  if (!vendor) return NextResponse.json({ error: "Listing not found." }, { status: 404 });

  const emails = Array.from(
    new Set(
      String(b.emails || "")
        .split(/[\s,;]+/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => EMAIL_RE.test(e))
    )
  ).slice(0, 20);
  if (!emails.length) {
    return NextResponse.json({ error: "Add at least one valid email address." }, { status: 400 });
  }

  let sent = 0;
  let skipped = 0;
  for (const to of emails) {
    try {
      const ok = await sendReviewInvite(to, vendor.name, slug);
      ok ? sent++ : skipped++;
    } catch {
      skipped++;
    }
    await new Promise((r) => setTimeout(r, 600)); // under Resend's ~2/s limit
  }
  return NextResponse.json({ ok: true, sent, skipped });
}
