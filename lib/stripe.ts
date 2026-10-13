import Stripe from "stripe";

// Stripe client. Null until STRIPE_SECRET_KEY is set, so the app builds and
// runs without payments configured (checkout returns 503 in that case).
const key = process.env.STRIPE_SECRET_KEY || "";
export const stripe = key ? new Stripe(key) : null;

// Featured placement pricing (annual subscription). Change here to adjust.
export const FEATURED_PRICE_CENTS = 5000; // $50.00
export const FEATURED_INTERVAL = "year" as const;

// Per-page "Boost" pricing (annual subscription): guarantees the #1 slot on ONE
// specific category or format page, above even other Featured listings. Priced
// above Featured because it's a single high-intent page locked to one company.
// Change here to adjust the price for every boost checkout.
export const BOOST_PRICE_CENTS = 9900; // $99.00/yr per page
export const BOOST_INTERVAL = "year" as const;
