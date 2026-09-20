"use client";

import { useState } from "react";

function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function VendorLogo({
  name,
  website,
  logo,
  size = 44,
}: {
  name: string;
  website?: string;
  logo?: string;
  size?: number;
}) {
  const domain = domainFromUrl(website || "");
  const https = (u?: string) => (u ? u.replace(/^http:\/\//i, "https://") : "");
  // Load via our cached /api/logo proxy (explicit logo -> DuckDuckGo -> Google,
  // server-side with a timeout, then CDN-cached for a year). One same-origin
  // request instead of a slow third-party redirect; monogram on total failure.
  const params = new URLSearchParams();
  if (domain) params.set("d", domain);
  if (logo) params.set("u", https(logo));
  const sources = (domain || logo
    ? [`/api/logo?${params.toString()}`]
    : []) as string[];

  const [idx, setIdx] = useState(0);
  const letter = (name.trim()[0] || "?").toUpperCase();

  if (idx >= sources.length) {
    return (
      <div
        className="vlogo vlogo--mono"
        style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
        aria-hidden="true"
      >
        {letter}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="vlogo"
      src={sources[idx]}
      alt={name ? `${name} logo` : "Company logo"}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onError={() => setIdx((i) => i + 1)}
    />
  );
}
