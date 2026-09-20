// Logo proxy + cache. Vendor logos were loaded by pointing <img> straight at
// Google's favicon service, which 301-redirects and is slow/inconsistent (seen
// up to ~12s). This endpoint fetches the logo server-side with a hard timeout,
// prefers a direct-image source (DuckDuckGo, no redirect), and returns it with a
// long CDN cache — so after the first fetch every viewer gets it instantly from
// our edge instead of a third party.

export const dynamic = "force-dynamic";

const TIMEOUT_MS = 2500;

async function tryFetch(url: string): Promise<Response | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: "follow" });
    clearTimeout(t);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (!ct.startsWith("image/")) return null;
    return res;
  } catch {
    clearTimeout(t);
    return null;
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const domain = (url.searchParams.get("d") || "")
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "");
  const explicit = url.searchParams.get("u") || "";

  // Order: explicit logo → DuckDuckGo (direct image, fast) → Google favicon.
  const candidates: string[] = [];
  if (explicit && /^https?:\/\//i.test(explicit)) {
    candidates.push(explicit.replace(/^http:/i, "https:"));
  }
  if (domain) {
    candidates.push(`https://icons.duckduckgo.com/ip3/${domain}.ico`);
    candidates.push(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
  }

  for (const c of candidates) {
    const res = await tryFetch(c);
    if (!res) continue;
    const buf = await res.arrayBuffer();
    // Skip empty/placeholder blobs so the client can fall back to a monogram.
    if (buf.byteLength > 70) {
      return new Response(buf, {
        headers: {
          "Content-Type": res.headers.get("content-type") || "image/x-icon",
          // Cache hard at the edge: one slow upstream fetch, then instant for all.
          "Cache-Control":
            "public, max-age=86400, s-maxage=31536000, stale-while-revalidate=604800, immutable",
        },
      });
    }
  }

  // No usable favicon — return a neutral monogram (200) instead of a 404, so
  // crawlers don't see broken internal resources and the card still shows a mark.
  const letter = ((explicit || domain).replace(/^www\./, "").trim()[0] || "?").toUpperCase();
  const safe = letter.replace(/[<>&"]/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" role="img" aria-label="logo placeholder"><text x="64" y="66" font-family="ui-sans-serif,system-ui,Segoe UI,Arial,sans-serif" font-size="66" font-weight="700" fill="#987a41" text-anchor="middle" dominant-baseline="central">${safe}</text></svg>`;
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800",
    },
  });
}
