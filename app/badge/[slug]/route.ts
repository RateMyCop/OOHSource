import { getVendorBySlug, getVendorsByCategory } from "@/lib/vendors";
import { getList, rankOfVendor } from "@/lib/lists";
import { recordBadgeImpression } from "@/lib/outreach";

// Dynamic so we can see the Referer on each load and record which external
// sites have embedded the badge (the real "they engaged" signal). Cached
// privately in the browser for perf, but NOT shared-cached, so external embeds
// still reach the function often enough to capture their domain.
export const dynamic = "force-dynamic";

// The referring domain if the badge is embedded on an EXTERNAL site (not our own
// pages, our email preview, or a mail image-proxy). Returns null otherwise.
function externalHost(referer: string | null): string | null {
  if (!referer) return null;
  try {
    const h = new URL(referer).hostname.toLowerCase().replace(/^www\./, "");
    if (!h) return null;
    if (
      h.endsWith("oohsource.com") ||
      h === "localhost" ||
      h.endsWith(".vercel.app") ||
      h.endsWith("googleusercontent.com") || // Gmail image proxy = an open, not an embed
      h.endsWith("mail.google.com")
    ) {
      return null;
    }
    return h;
  } catch {
    return null;
  }
}

const MONO =
  "ui-monospace, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";

type Palette = {
  bg: string;
  line: string;
  ink: string;
  sub: string;
  bronze: string;
};

function palette(dark: boolean): Palette {
  return dark
    ? { bg: "#1a1b1e", line: "#343740", ink: "#eceae2", sub: "#9a9da3", bronze: "#c99a52" }
    : { bg: "#ffffff", line: "#d8d5cc", ink: "#1a1b1e", sub: "#77787b", bronze: "#8a6d33" };
}

function svgResponse(svg: string) {
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      // Private (browser-only) cache: keeps the badge fast for repeat viewers
      // without a shared CDN cache swallowing every impression.
      "Cache-Control": "private, max-age=3600",
    },
  });
}

// Generic listing badge — "VERIFIED ON / LISTED ON OOHsource". Clutch-style
// backlink + trust mark for any listing.
function listingBadge(verified: boolean, dark: boolean): string {
  const p = palette(dark);
  const eyebrow = verified ? "VERIFIED ON" : "LISTED ON";
  const W = 214;
  const H = 66;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${eyebrow} OOHsource">
  <rect x="0.75" y="0.75" width="${W - 1.5}" height="${H - 1.5}" rx="9" fill="${p.bg}" stroke="${p.line}" stroke-width="1.5"/>
  <g transform="translate(20,33)">
    <circle cx="0" cy="0" r="12.5" fill="none" stroke="${p.ink}" stroke-width="3.4"/>
    <circle cx="0" cy="-12.5" r="4" fill="${p.bronze}"/>
  </g>
  <text x="46" y="29" font-family="${MONO}" font-size="8.5" letter-spacing="1.6" font-weight="600" fill="${p.bronze}">${eyebrow}</text>
  <text x="46" y="48" font-family="${MONO}" font-size="17" letter-spacing="-0.4" font-weight="700" fill="${p.ink}">OOH<tspan fill="${p.sub}">source</tspan></text>
</svg>`;
}

// Award / rank badge — "#3 · Top OOH Agencies · OOHsource 2026". Only a company
// that actually places within a list's limit can render this (see GET).
function rankBadge(
  rank: number,
  limit: number,
  label: string,
  year: number,
  dark: boolean
): string {
  const p = palette(dark);
  const W = 270;
  const H = 96;
  const cx = 50;
  const cy = 48;
  const rankText = `#${rank}`;
  const rankSize = rankText.length <= 2 ? 22 : 15.5;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Ranked ${rankText} — ${label} on OOHsource ${year}">
  <rect x="0.75" y="0.75" width="${W - 1.5}" height="${H - 1.5}" rx="11" fill="${p.bg}" stroke="${p.line}" stroke-width="1.5"/>
  <g>
    <path d="M40 58 L33 86 L47 77 L50 60 Z" fill="${p.bronze}" opacity="0.85"/>
    <path d="M60 58 L67 86 L53 77 L50 60 Z" fill="${p.bronze}" opacity="0.85"/>
    <circle cx="${cx}" cy="${cy}" r="27" fill="${p.bronze}"/>
    <circle cx="${cx}" cy="${cy}" r="21.5" fill="${p.bg}" stroke="${p.bronze}" stroke-width="1.5"/>
    <text x="${cx}" y="${cy}" font-family="${MONO}" font-size="${rankSize}" font-weight="700" letter-spacing="-0.5" fill="${p.ink}" text-anchor="middle" dominant-baseline="central">${rankText}</text>
  </g>
  <text x="90" y="34" font-family="${MONO}" font-size="8.5" letter-spacing="1.5" font-weight="600" fill="${p.bronze}">TOP ${limit} · ${year}</text>
  <text x="90" y="57" font-family="${MONO}" font-size="13.5" letter-spacing="-0.4" font-weight="700" fill="${p.ink}">${escapeXml(label)}</text>
  <text x="90" y="78" font-family="${MONO}" font-size="12.5" letter-spacing="-0.3" font-weight="700" fill="${p.sub}">OOH<tspan fill="${p.ink}">source</tspan><tspan fill="${p.sub}"> directory</tspan></text>
</svg>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Dynamic embeddable badge (SVG). Vendors drop this on their own site linking
// back to their OOHsource profile — a backlink + trust mark, Clutch-style.
//   ?theme=dark|light          (default light)
//   ?list=<list-slug>          award badge showing the company's rank in that
//                              list — served ONLY if the company actually places
//                              within the list's limit; otherwise we fall back to
//                              the listing badge so no one can fake a rank.
export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const vendor = await getVendorBySlug(params.slug);
  if (!vendor) {
    return new Response("Not found", { status: 404 });
  }

  // If this badge is rendering on an external site, log who embedded it.
  const host = externalHost(req.headers.get("referer"));
  if (host) {
    try {
      await recordBadgeImpression(vendor.slug, host);
    } catch {
      /* tracking must never break the image */
    }
  }

  const url = new URL(req.url);
  const dark = url.searchParams.get("theme") === "dark";
  const listSlug = url.searchParams.get("list");

  if (listSlug) {
    const list = getList(listSlug);
    // The company must belong to the list's category AND place within its limit.
    if (list && vendor.categorySlug === list.category) {
      const pool = await getVendorsByCategory(list.category);
      const rank = rankOfVendor(pool, vendor.slug, list.limit);
      if (rank !== null) {
        const year = new Date().getUTCFullYear();
        return svgResponse(
          rankBadge(rank, list.limit, list.badgeLabel, year, dark)
        );
      }
    }
    // Not eligible / doesn't place — fall through to the generic badge.
  }

  return svgResponse(listingBadge(vendor.verified, dark));
}
