"use client";

import { useEffect, useRef } from "react";

// Fire-and-forget beacon to /api/track. Uses sendBeacon so it survives the page
// unloading (e.g. when the click navigates away); falls back to keepalive fetch.
function send(slug: string, e: "view" | "website" | "email") {
  if (typeof navigator === "undefined") return;
  try {
    const payload = JSON.stringify({ slug, e });
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
    send(slug, "view");
    try {
      if (new URLSearchParams(window.location.search).get("ref") === "email") {
        const body = JSON.stringify({ slug });
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
