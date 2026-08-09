import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { fetchVendorIdMap, updateAirtableRecords } from "@/lib/airtable";

export const dynamic = "force-dynamic";

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
      if (slug) await setTier(slug, "Featured", true);
    } else if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const slug = String(sub.metadata?.slug || "").trim();
      if (slug) await setTier(slug, "Free");
    }
  } catch (e) {
    console.error("[oohsource] stripe webhook handler error:", e);
    // 200 so Stripe doesn't retry forever on an Airtable hiccup; logged above.
    return NextResponse.json({ received: true, handlerError: true });
  }

  return NextResponse.json({ received: true });
}
