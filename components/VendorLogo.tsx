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
  // Try, in order: explicit logo -> real brand logo -> favicon -> monogram.
  const sources = [
    logo,
    domain ? `https://logo.clearbit.com/${domain}` : "",
    domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : "",
  ].filter(Boolean) as string[];

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
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={() => setIdx((i) => i + 1)}
    />
  );
}
