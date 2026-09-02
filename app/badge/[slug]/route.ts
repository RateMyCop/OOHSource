import { getVendorBySlug } from "@/lib/vendors";

export const revalidate = 3600;

// Dynamic embeddable badge (SVG). Vendors drop this on their own site linking
// back to their OOHsource profile — a backlink + trust mark, Clutch-style.
// Query: ?theme=dark|light (default light). Verified listings show "VERIFIED ON",
// others "LISTED ON".
export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const vendor = await getVendorBySlug(params.slug);
  if (!vendor) {
    return new Response("Not found", { status: 404 });
  }
  const dark = new URL(req.url).searchParams.get("theme") === "dark";
  const eyebrow = vendor.verified ? "VERIFIED ON" : "LISTED ON";

  const bg = dark ? "#1a1b1e" : "#ffffff";
  const line = dark ? "#343740" : "#d8d5cc";
  const ink = dark ? "#eceae2" : "#1a1b1e";
  const bronze = dark ? "#c99a52" : "#8a6d33";
  const monoStack =
    "ui-monospace, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";

  const W = 214;
  const H = 66;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${eyebrow} OOHsource">
  <rect x="0.75" y="0.75" width="${W - 1.5}" height="${H - 1.5}" rx="9" fill="${bg}" stroke="${line}" stroke-width="1.5"/>
  <g transform="translate(20,33)">
    <circle cx="0" cy="0" r="12.5" fill="none" stroke="${ink}" stroke-width="3.4"/>
    <circle cx="0" cy="-12.5" r="4" fill="${bronze}"/>
  </g>
  <text x="46" y="29" font-family="${monoStack}" font-size="8.5" letter-spacing="1.6" font-weight="600" fill="${bronze}">${eyebrow}</text>
  <text x="46" y="48" font-family="${monoStack}" font-size="17" letter-spacing="-0.4" font-weight="700" fill="${ink}">OOH<tspan fill="${dark ? "#9a9da3" : "#77787b"}">source</tspan></text>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
