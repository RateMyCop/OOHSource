import { NextResponse } from "next/server";
import { stripe, FEATURED_PRICE_CENTS, FEATURED_INTERVAL } from "@/lib/stripe";
import { getVendorBySlug } from "@/lib/vendors";

export const dynamic = "force-dynamic";

// Creates a Stripe Checkout session to Feature a specific vendor listing.
// Body: { slug }. Returns { url } to redirect the buyer to.
export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Payments are not configured yet." },
      { status: 503 }
    );
  }

  let body: { slug?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const slug = String(body.slug ?? "").trim();
  if (!slug) {
    return NextResponse.json({ error: "Missing listing" }, { status: 400 });
  }

  const vendor = await getVendorBySlug(slug);
  if (!vendor) {
    return NextResponse.json({ error: "Unknown listing" }, { status: 404 });
  }

  const origin =
    req.headers.get("origin") ||
    (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.oohsource.com");

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: FEATURED_PRICE_CENTS,
            recurring: { interval: FEATURED_INTERVAL },
            product_data: {
              name: `OOHsource Featured — ${vendor.name}`,
              description:
                "Featured placement in the OOHsource directory (billed annually).",
            },
          },
        },
      ],
      client_reference_id: slug,
      metadata: { slug, vendorName: vendor.name },
      subscription_data: { metadata: { slug, vendorName: vendor.name } },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      success_url: `${origin}/api/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?canceled=1`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[oohsource] checkout error:", e);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 }
    );
  }
}
