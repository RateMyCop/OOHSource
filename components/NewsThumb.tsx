"use client";

import { useState } from "react";

// News thumbnail with graceful fallbacks:
//   article image  →  publication logo tile  →  tinted headline tile
// so the grid never shows a broken-image icon and image-less stories still
// read as branded cards.
function tint(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 4;
}

export function NewsThumb({
  image,
  logo,
  source,
  title,
  kind,
}: {
  image: string;
  logo: string;
  source: string;
  title: string;
  kind: "hero" | "card";
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  if (image && !imgFailed) {
    return (
      <div className={`news-media news-media--${kind}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }

  if (logo && !logoFailed) {
    return (
      <div
        className={`news-media news-media--${kind} news-media--logo`}
        data-tint={tint(title)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo}
          alt={source}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setLogoFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`news-media news-media--${kind} news-media--noimg`}
      data-tint={tint(title)}
    >
      <span className="news-media-kicker">{source}</span>
    </div>
  );
}
