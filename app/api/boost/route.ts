import { NextResponse } from "next/server";
import { stripe, BOOST_PRICE_CENTS, BOOST_INTERVAL } from "@/lib/stripe";
import { getVendorBySlug } from "@/lib/vendors";
import { describePageKey } from "@/lib/boosts";

export const dynamic = "force-dynamic";

// Creates a Stripe Checkout session to BOOST a listing to #1 on one specific
// page. Body: { slug, pageKey } where pageKey is "category:<slug>" or
// "format:<slug>". Returns { url } to redirect the buyer to.
export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Payments are not configured yet." },
      { status: 503 }
    );
  }

  let body: { slug?: string; pageKey?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const slug = String(body.slug ?? "").trim();
  const pageKey = String(body.pageKey ?? "").trim();
  if (!slug) {
    return NextResponse.json({ error: "Missing listing" }, { status: 400 });
  }

  const page = describePageKey(pageKey);
  if (!page) {
    return NextResponse.json({ error: "This page can't be boosted." }, { status: 400 });
  }

  const vendor = await getVendorBySlug(slug);
  if (!vendor) {
    return NextResponse.json({ error: "Unknown listing" }, { status: 404 });
  }

  const origin =
    req.headers.get("origin") ||
    (process.env.NEXT_PUBLIC_SITE_URL ?? "https://oohsource.com");

  const meta = { slug, pageKey, kind: "boost", vendorName: vendor.name };

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: BOOST_PRICE_CENTS,
            recurring: { interval: BOOST_INTERVAL },
            product_data: {
              name: `OOHsource Boost — ${vendor.name} · ${page.label}`,
              description: `Guaranteed #1 placement on the ${page.label} ${page.kind} page (billed annually).`,
            },
          },
        },
      ],
      client_reference_id: slug,
      metadata: meta,
      subscription_data: { metadata: meta },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      success_url: `${origin}/api/boost/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard?tab=analytics&boost=canceled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[oohsource] boost checkout error:", e);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 }
    );
  }
}
