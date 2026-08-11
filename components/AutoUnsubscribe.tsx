"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Completes the unsubscribe automatically when a real browser loads the confirm
// page (link scanners don't run JS, so they still can't opt anyone out). Falls
// back to a manual button if the auto-request fails.
export function AutoUnsubscribe({ token, email }: { token: string; email: string }) {
  const [state, setState] = useState<"working" | "ok" | "err">("working");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/unsubscribe?t=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { Accept: "application/json" },
    })
      .then((r) => {
        if (!cancelled) setState(r.ok ? "ok" : "err");
      })
      .catch(() => {
        if (!cancelled) setState("err");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (state === "ok") {
    return (
      <>
        <span className="eyebrow">
          <span className="label label--accent">Unsubscribed</span>
        </span>
        <h1>You&rsquo;re unsubscribed.</h1>
        <p className="lede" style={{ marginBottom: 26 }}>
          No more outreach emails to <strong>{email}</strong>. Your directory
          listing stays live — you can still claim or update it anytime.
        </p>
        <div className="hero-cta">
          <Link className="btn btn--primary" href="/directory">
            Browse the directory
          </Link>
        </div>
      </>
    );
  }

  if (state === "err") {
    return (
      <>
        <span className="eyebrow">
          <span className="label label--accent">Almost done</span>
        </span>
        <h1>Confirm unsubscribe.</h1>
        <p className="lede" style={{ marginBottom: 26 }}>
          Click below to stop outreach emails to <strong>{email}</strong>.
        </p>
        <form action="/api/unsubscribe" method="post">
          <input type="hidden" name="t" value={token} />
          <button className="btn btn--primary" type="submit">
            Unsubscribe
          </button>
        </form>
      </>
    );
  }

  return (
    <>
      <span className="eyebrow">
        <span className="label label--accent">One moment</span>
      </span>
      <h1>Unsubscribing&hellip;</h1>
      <p className="lede" style={{ marginBottom: 26 }}>
        Removing <strong>{email}</strong> from OOHsource emails.
      </p>
    </>
  );
}
