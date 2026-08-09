"use client";

import Image from "next/image";
import { useState } from "react";

// Banner image atop a vendor detail page. Served through Next/Vercel image
// optimization (AVIF/WebP, edge-cached) instead of hotlinking the origin.
// Hides itself if the image fails to load, so a dead URL never leaves a
// broken-image icon.
export function HeroImage({ src, alt }: { src: string; alt: string }) {
  const [ok, setOk] = useState(true);
  if (!src || !ok) return null;
  return (
    <div className="detail-hero">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 820px) 100vw, 700px"
        style={{ objectFit: "cover" }}
        onError={() => setOk(false)}
      />
    </div>
  );
}
