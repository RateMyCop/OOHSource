"use client";

import { useState } from "react";

// Kicks off Stripe Checkout to Feature a listing. Redirects to Stripe on click.
export function FeatureButton({
  slug,
  label = "★ Feature this listing — $50/yr",
}: {
  slug: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function go() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url as string;
        return;
      }
      setErr(data.error || "Unable to start checkout.");
    } catch {
      setErr("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        className="btn btn--feature"
        onClick={go}
        disabled={loading}
      >
        {loading ? "Redirecting…" : label}
      </button>
      {err && <p className="feature-err">{err}</p>}
    </div>
  );
}
