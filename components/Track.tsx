"use client";

import { useEffect, useRef } from "react";

// Fire-and-forget beacon to /api/track. Uses sendBeacon so it survives the page
// unloading (e.g. when the click navigates away); falls back to keepalive fetch.
function send(slug: string, e: "view" | "website" | "email", ref?: string) {
  if (typeof navigator === "undefined") return;
  try {
    const payload = JSON.stringify(ref !== undefined ? { slug, e, ref } : { slug, e });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/track",
        new Blob([payload], { type: "application/json" })
      );
    } else {
      void fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      });
    }
  } catch {
    /* tracking must never throw into the UI */
  }
}

// Records one profile view on mount — plus an outreach click-through when the
// visitor arrived from an email link (?ref=email). Renders nothing.
export function TrackView({ slug }: { slug: string }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    send(slug, "view", typeof document !== "undefined" ? document.referrer : "");
    try {
      // Attribute the click-through to its outreach source. "email" = the
      // original claim drip; "badge-email" = the top-list award-badge campaign.
      const ref = new URLSearchParams(window.location.search).get("ref");
      if (ref === "email" || ref === "badge-email") {
        const body = JSON.stringify({ slug, source: ref });
        if (navigator.sendBeacon) {
          navigator.sendBeacon("/api/em-visit", new Blob([body], { type: "application/json" }));
        } else {
          void fetch("/api/em-visit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
            keepalive: true,
          });
        }
      }
    } catch {
      /* attribution is best-effort */
    }
  }, [slug]);
  return null;
}

type TrackedLinkProps = {
  slug: string;
  event: "website" | "email";
  href: string;
  className?: string;
  target?: string;
  rel?: string;
  children: React.ReactNode;
};

// Anchor that records a click before navigating.
export function TrackedLink({
  slug,
  event,
  href,
  className,
  target,
  rel,
  children,
}: TrackedLinkProps) {
  return (
    <a
      href={href}
      className={className}
      target={target}
      rel={rel}
      onClick={() => send(slug, event)}
    >
      {children}
    </a>
  );
}
