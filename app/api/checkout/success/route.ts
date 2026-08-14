import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { fetchVendorIdMap, updateAirtableRecords } from "@/lib/airtable";

export const dynamic = "force-dynamic";

// Post-checkout confirmation. Stripe redirects here with the session id; we
// verify the session is paid directly against Stripe (server-side, using the
// secret key) and promote the listing to Featured — then send the buyer to
// their listing. This makes the upgrade reliable on redirect, independent of
// webhook delivery. (The webhook still handles cancellations/renewals.)
export async function GET(req: Request) {
  const origin =
    req.headers.get("origin") ||
    (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.oohsource.com");
  const url = new URL(req.url);
  const sessionId = (url.searchParams.get("session_id") || "").trim();

  const fail = (path: string) => NextResponse.redirect(`${origin}${path}`, 303);

  if (!stripe || !sessionId) return fail("/pricing?checkout=error");

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid =
      session.payment_status === "paid" ||
      session.payment_status === "no_payment_required" ||
      session.status === "complete";
    const slug = String(
      session.client_reference_id || session.metadata?.slug || ""
    ).trim();

    if (paid && slug) {
      const idMap = await fetchVendorIdMap();
      const id = idMap[slug];
      if (id) {
        await updateAirtableRecords([
          { id, fields: { Tier: "Featured", Verified: true } },
        ]);
      }
      return fail(`/directory/${slug}?featured=1`);
    }
    return fail(slug ? `/directory/${slug}` : "/pricing?checkout=incomplete");
  } catch (e) {
    console.error("[oohsource] checkout success confirm error:", e);
    return fail("/pricing?checkout=error");
  }
}
