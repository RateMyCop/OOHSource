import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { activateBoost, describePageKey } from "@/lib/boosts";

export const dynamic = "force-dynamic";

// Roughly the annual period plus a grace margin; the webhook extends this on
// each renewal (invoice.payment_succeeded) and clears it on cancellation.
const BOOST_TTL_MS = 400 * 24 * 60 * 60 * 1000;

// Post-checkout confirmation for a Boost. Stripe redirects here; we verify the
// session is paid server-side and activate the #1 pin for that page, then send
// the buyer to the page they just took the top of. (The webhook independently
// handles renewals/cancellations.)
export async function GET(req: Request) {
  const origin =
    req.headers.get("origin") ||
    (process.env.NEXT_PUBLIC_SITE_URL ?? "https://oohsource.com");
  const url = new URL(req.url);
  const sessionId = (url.searchParams.get("session_id") || "").trim();

  const go = (path: string) => NextResponse.redirect(`${origin}${path}`, 303);

  if (!stripe || !sessionId) return go("/dashboard?tab=analytics&boost=error");

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid =
      session.payment_status === "paid" ||
      session.payment_status === "no_payment_required" ||
      session.status === "complete";
    const slug = String(
      session.client_reference_id || session.metadata?.slug || ""
    ).trim();
    const pageKey = String(session.metadata?.pageKey || "").trim();
    const page = describePageKey(pageKey);

    if (paid && slug && page) {
      await activateBoost(slug, pageKey, Date.now() + BOOST_TTL_MS);
      return go(`${page.url}?boosted=1`);
    }
    return go("/dashboard?tab=analytics&boost=incomplete");
  } catch (e) {
    console.error("[oohsource] boost success confirm error:", e);
    return go("/dashboard?tab=analytics&boost=error");
  }
}
