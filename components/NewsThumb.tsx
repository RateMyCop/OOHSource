"use client";

import { useState } from "react";

// Renders a news thumbnail, falling back to a tinted headline tile when the
// item has no image OR the image fails to load (publishers often hotlink-block),
// so the grid never shows a broken-image icon.
function tint(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 4;
}

export function NewsThumb({
  image,
  source,
  title,
  kind,
}: {
  image: string;
  source: string;
  title: string;
  kind: "hero" | "card";
}) {
  const [failed, setFailed] = useState(false);

  if (image && !failed) {
    return (
      <div className={`news-media news-media--${kind}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
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
