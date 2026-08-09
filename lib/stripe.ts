import Stripe from "stripe";

// Stripe client. Null until STRIPE_SECRET_KEY is set, so the app builds and
// runs without payments configured (checkout returns 503 in that case).
const key = process.env.STRIPE_SECRET_KEY || "";
export const stripe = key ? new Stripe(key) : null;

// Featured placement pricing (annual subscription). Change here to adjust.
export const FEATURED_PRICE_CENTS = 5000; // $50.00
export const FEATURED_INTERVAL = "year" as const;
