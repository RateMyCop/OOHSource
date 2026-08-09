"use client";

import { useState } from "react";

// Banner image atop a vendor detail page. Hides itself if the (hotlinked)
// image fails to load, so a dead URL never leaves a broken-image icon.
export function HeroImage({ src, alt }: { src: string; alt: string }) {
  const [ok, setOk] = useState(true);
  if (!src || !ok) return null;
  return (
    <div className="detail-hero">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" onError={() => setOk(false)} />
    </div>
  );
}
