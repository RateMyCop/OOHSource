import Stripe from "stripe";

// Stripe client. Null until STRIPE_SECRET_KEY is set, so the app builds and
// runs without payments configured (checkout returns 503 in that case).
const key = process.env.STRIPE_SECRET_KEY || "";
export const stripe = key ? new Stripe(key) : null;

// Featured placement pricing (annual subscription). Change here to adjust.
export const FEATURED_PRICE_CENTS = 5000; // $50.00
export const FEATURED_INTERVAL = "year" as const;

// Per-page "Boost" pricing (monthly subscription): guarantees the #1 slot on
// ONE specific category or format page, above even other Featured listings.
// Low monthly price to make locking a single high-intent page an easy yes.
// Change here to adjust the price for every boost checkout.
export const BOOST_PRICE_CENTS = 900; // $9.00/mo per page
export const BOOST_INTERVAL = "month" as const;
