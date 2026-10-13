import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { fetchVendorIdMap, updateAirtableRecords } from "@/lib/airtable";
import { activateBoost, deactivateBoost, describePageKey } from "@/lib/boosts";

export const dynamic = "force-dynamic";

// A boost's active window: one monthly cycle plus a grace margin, re-extended
// on every successful renewal invoice and cleared when the subscription ends.
const BOOST_TTL_MS = 40 * 24 * 60 * 60 * 1000;

async function setTier(
  slug: string,
  tier: "Free" | "Featured",
  verified?: boolean
) {
  const idMap = await fetchVendorIdMap();
  const id = idMap[slug];
  if (!id) return;
  const fields: Record<string, unknown> = { Tier: tier };
  if (verified !== undefined) fields.Verified = verified;
  await updateAirtableRecords([{ id, fields }]);
}

// Stripe webhook: on successful checkout, promote the listing to Featured;
// on subscription cancellation, revert it to Free. Requires the raw request
// body for signature verification (STRIPE_WEBHOOK_SECRET).
export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }
  const secret = process.env.STRIPE_WEBHOOK_SECRET || "";
  const sig = req.headers.get("stripe-signature") || "";
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = secret
      ? stripe.webhooks.constructEvent(raw, sig, secret)
      : (JSON.parse(raw) as Stripe.Event);
  } catch (e) {
    return NextResponse.json(
      { error: `Signature verification failed: ${(e as Error).message}` },
      { status: 400 }
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      const s = event.data.object as Stripe.Checkout.Session;
      const slug = String(
        s.client_reference_id || s.metadata?.slug || ""
      ).trim();
      const pageKey = String(s.metadata?.pageKey || "").trim();
      if (s.metadata?.kind === "boost") {
        // Per-page Boost — pin the listing to #1 on that page (don't touch Tier).
        if (slug && describePageKey(pageKey)) {
          await activateBoost(slug, pageKey, Date.now() + BOOST_TTL_MS);
        }
      } else if (slug) {
        await setTier(slug, "Featured", true);
      }
    } else if (event.type === "invoice.payment_succeeded") {
      // Renewal: re-extend an active boost's window so it never lapses while paid.
      const inv = event.data.object as Stripe.Invoice & {
        subscription_details?: { metadata?: Record<string, string> };
      };
      const meta = inv.subscription_details?.metadata || {};
      if (meta.kind === "boost") {
        const slug = String(meta.slug || "").trim();
        const pageKey = String(meta.pageKey || "").trim();
        if (slug && describePageKey(pageKey)) {
          await activateBoost(slug, pageKey, Date.now() + BOOST_TTL_MS);
        }
      }
    } else if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const slug = String(sub.metadata?.slug || "").trim();
      const pageKey = String(sub.metadata?.pageKey || "").trim();
      if (sub.metadata?.kind === "boost") {
        if (slug && pageKey) await deactivateBoost(slug, pageKey);
      } else if (slug) {
        await setTier(slug, "Free");
      }
    }
  } catch (e) {
    console.error("[oohsource] stripe webhook handler error:", e);
    // 200 so Stripe doesn't retry forever on an Airtable hiccup; logged above.
    return NextResponse.json({ received: true, handlerError: true });
  }

  return NextResponse.json({ received: true });
}
