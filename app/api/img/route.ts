import sharp from "sharp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // we set our own long cache header
export const maxDuration = 15;

// Same-origin image optimizer. Vendor hero/gallery images come from arbitrary
// hosts and are often multi-MB. This fetches the source, downsizes to the
// requested width and re-encodes to WebP, then caches hard at the edge — so the
// page serves a small optimized image instead of the heavy original. On any
// problem it redirects to the original so an image never breaks.
const TIMEOUT_MS = 8000;

function original(u: string) {
  return Response.redirect(u, 302);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const u = url.searchParams.get("u") || "";
  const w = Math.min(2000, Math.max(48, parseInt(url.searchParams.get("w") || "800", 10) || 800));
  if (!/^https:\/\/[^\s]+$/i.test(u)) {
    return new Response("bad url", { status: 400 });
  }

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(u, { signal: ctrl.signal, redirect: "follow" });
    clearTimeout(t);
    if (!res.ok) return original(u);
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    if (!ct.startsWith("image/")) return original(u);
    // SVGs are already tiny/vector — pass through untouched.
    if (ct.includes("svg")) return original(u);

    const input = Buffer.from(await res.arrayBuffer());
    const out = await sharp(input)
      .rotate() // respect EXIF orientation
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 72 })
      .toBuffer();

    return new Response(out, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=86400, s-maxage=31536000, stale-while-revalidate=604800, immutable",
      },
    });
  } catch {
    clearTimeout(t);
    return original(u);
  }
}
