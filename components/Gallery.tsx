"use client";

import { useState } from "react";

// Portfolio gallery with a click-to-enlarge lightbox. Hotlinked vendor images
// that fail to load are dropped so the grid never shows broken thumbnails.
export function Gallery({ images, name }: { images: string[]; name: string }) {
  const [broken, setBroken] = useState<Record<number, boolean>>({});
  const [open, setOpen] = useState<number | null>(null);

  // Upgrade insecure URLs so hotlinked images don't trip mixed-content on https.
  const secureImages = images.map((s) => s.replace(/^http:\/\//i, "https://"));
  const visible = secureImages
    .map((src, i) => ({ src, i }))
    .filter((x) => !broken[x.i]);
  if (visible.length === 0) return null;

  return (
    <>
      <div className="gallery">
        {visible.map(({ src, i }) => (
          <button
            key={i}
            type="button"
            className="gallery-thumb"
            onClick={() => setOpen(i)}
            aria-label={`View ${name} portfolio image`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`${name} work`}
              loading="lazy"
              onError={() => setBroken((b) => ({ ...b, [i]: true }))}
            />
          </button>
        ))}
      </div>

      {open !== null && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(null)}
        >
          <button
            className="lightbox-close"
            type="button"
            aria-label="Close"
            onClick={() => setOpen(null)}
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={secureImages[open]} alt={`${name} work`} />
        </div>
      )}
    </>
  );
}
