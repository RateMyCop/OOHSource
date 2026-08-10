"use client";

import { useState } from "react";

// Banner image atop a vendor detail page. Rendered as a plain <img> (not
// next/image) so owner-supplied URLs from any host work without needing each
// host allow-listed in next.config. Hides itself if the image fails to load,
// so a dead URL never leaves a broken-image icon.
export function HeroImage({ src, alt }: { src: string; alt: string }) {
  const [ok, setOk] = useState(true);
  if (!src || !ok) return null;
  return (
    <div className="detail-hero">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
        onError={() => setOk(false)}
      />
    </div>
  );
}
