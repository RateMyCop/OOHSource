"use client";

import { useState } from "react";

// Kicks off Stripe Checkout to Boost one listing to #1 on one specific page.
// Redirects to Stripe on click. Used per-row in the dashboard "Where you
// appear" table, so every owner (Free or Featured) can lock a top page.
export function BoostButton({
  slug,
  pageKey,
  label = "Boost to #1 ↑",
}: {
  slug: string;
  pageKey: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function go() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, pageKey }),
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
    <>
      <button
        type="button"
        className="perf-boost"
        onClick={go}
        disabled={loading}
      >
        {loading ? "Redirecting…" : label}
      </button>
      {err && <span className="perf-boost-err">{err}</span>}
    </>
  );
}
