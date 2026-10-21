"use client";

import { useState } from "react";

// Article thumbnail. Items without an image are filtered out upstream, so this
// only falls back (to a tinted headline tile) in the rare case an image URL
// fails to load at runtime.
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
