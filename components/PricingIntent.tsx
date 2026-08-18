"use client";

import { useEffect } from "react";

// Fires once when the pricing page loads. The endpoint decides whether to act:
// only signed-in owners (whose email we know) get a one-time Featured nudge;
// anonymous visitors are a no-op. Renders nothing.
export function PricingIntent() {
  useEffect(() => {
    fetch("/api/pricing-intent", { method: "POST", keepalive: true }).catch(
      () => {}
    );
  }, []);
  return null;
}
