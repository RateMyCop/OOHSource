// Build a same-origin optimized-image URL (see /api/img). Downsizes + WebP.
// Leaves data:/relative URLs and our own SVG logo endpoint untouched.
export function imgProxy(url: string, w: number): string {
  if (!url) return url;
  if (url.startsWith("data:") || url.startsWith("/")) return url;
  const secure = url.replace(/^http:\/\//i, "https://");
  if (!/^https:\/\//i.test(secure)) return url;
  return `/api/img?u=${encodeURIComponent(secure)}&w=${w}`;
}
