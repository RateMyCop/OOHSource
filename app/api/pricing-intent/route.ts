import { NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/auth";
import { kv } from "@/lib/kv";
import { isSuppressed } from "@/lib/outreach";
import { ownedSlugsForEmail } from "@/lib/owner";
import { getVendorBySlug } from "@/lib/vendors";
import { emailConfigured, sendFeaturedNudge } from "@/lib/email";

export const dynamic = "force-dynamic";

// Fired (once, from the client) when the /pricing page loads. Only signed-in
// owners can be nudged — anonymous visitors have no email to send to. Sends a
// one-time Featured nudge, deduped per email so it never repeats.
const NUDGE_TTL = 60 * 24 * 3600; // 60 days

export async function POST() {
  const email = getSessionEmail();
  if (!email) return NextResponse.json({ ok: true, skipped: "anonymous" });

  const key = `pricenudge:${email.toLowerCase()}`;
  const r = kv();
  if (r) {
    // Atomic set-if-absent: the first pricing view wins; later ones skip.
    const first = await r.set(key, "1", { nx: true, ex: NUDGE_TTL });
    if (!first) return NextResponse.json({ ok: true, skipped: "already-nudged" });
  }

  if (!emailConfigured() || (await isSuppressed(email))) {
    return NextResponse.json({ ok: true, skipped: "suppressed-or-unconfigured" });
  }

  // Personalize with the owner's listing name when we can find it.
  let company = "";
  try {
    const slugs = await ownedSlugsForEmail(email);
    if (slugs[0]) {
      const v = await getVendorBySlug(slugs[0]);
      company = v?.name ?? "";
    }
  } catch {
    /* best-effort personalization */
  }

  try {
    await sendFeaturedNudge(email, company);
    return NextResponse.json({ ok: true, sent: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 }
    );
  }
}
