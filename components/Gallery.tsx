"use client";

import { useEffect, useState } from "react";

// Portfolio gallery with a click-to-enlarge lightbox that steps through images
// like a carousel (arrows, keyboard ←/→, wraps around). Hotlinked vendor images
// that fail to load are dropped so the grid never shows broken thumbnails.
export function Gallery({ images, name }: { images: string[]; name: string }) {
  const [broken, setBroken] = useState<Record<number, boolean>>({});
  const [open, setOpen] = useState<number | null>(null);

  // Upgrade insecure URLs so hotlinked images don't trip mixed-content on https.
  const secureImages = images.map((s) => s.replace(/^http:\/\//i, "https://"));
  const visible = secureImages
    .map((src, i) => ({ src, i }))
    .filter((x) => !broken[x.i]);

  // Step to the prev/next VISIBLE image, wrapping around.
  function go(dir: number) {
    setOpen((cur) => {
      if (cur === null || visible.length === 0) return cur;
      const pos = visible.findIndex((v) => v.i === cur);
      if (pos === -1) return visible[0].i;
      return visible[(pos + dir + visible.length) % visible.length].i;
    });
  }

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, visible.length]);

  if (visible.length === 0) return null;

  const pos = open === null ? -1 : visible.findIndex((v) => v.i === open);

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
          <button className="lightbox-close" type="button" aria-label="Close" onClick={() => setOpen(null)}>
            ✕
          </button>

          {visible.length > 1 && (
            <button
              className="lightbox-nav lightbox-prev"
              type="button"
              aria-label="Previous image"
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
            >
              ‹
            </button>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={secureImages[open]}
            alt={`${name} work`}
            onClick={(e) => e.stopPropagation()}
          />

          {visible.length > 1 && (
            <button
              className="lightbox-nav lightbox-next"
              type="button"
              aria-label="Next image"
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
            >
              ›
            </button>
          )}

          {visible.length > 1 && pos >= 0 && (
            <span className="lightbox-count" onClick={(e) => e.stopPropagation()}>
              {pos + 1} / {visible.length}
            </span>
          )}
        </div>
      )}
    </>
  );
}
