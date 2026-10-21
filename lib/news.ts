// OOH-industry news aggregator. Pulls public RSS/Atom feeds from industry
// publishers and shows headline + excerpt + an outbound link to the source.
// We never republish full articles — every item links out to the publisher,
// so this is a curated hub (fresh content + outbound authority), not a copy.
//
// Feeds are fetched with Next's CACHED fetch (revalidate), so /news is
// build-safe and refreshes itself without a cron. Broken/slow feeds are
// skipped, never fatal.

export type NewsItem = {
  title: string;
  link: string;
  source: string;
  date: string; // ISO, or "" if unknown
  excerpt: string;
  image: string; // article thumbnail URL, or "" if none found
  sourceLogo: string; // the publication's logo, used on image-less cards
};

// Curated OOH / DOOH industry publishers. Edit this list to add/remove sources.
// Only publishers that serve reliable https article images (so every card shows
// a real photo). Daily DOOH was dropped — its thumbnails are http-only and
// redirect/break over https, so they never render on our secure page.
const FEEDS: { url: string; source: string }[] = [
  { url: "https://oohtoday.com/feed/", source: "OOH Today" },
  { url: "https://billboardinsider.com/feed/", source: "Billboard Insider" },
];

// Hand-placed wordmark logos per publication (hosted locally) — preferred over
// the feed's favicon so the source reads as a real logo, not a sticker.
const SOURCE_LOGOS: Record<string, string> = {
  "OOH Today": "/pub-logos/oohtoday.png",
  "Billboard Insider": "/pub-logos/billboardinsider.png",
};

const REVALIDATE = 1800; // 30 min
const PER_FEED = 12;
const MAX_ITEMS = 48;

function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, "i"));
  return m ? m[1] : "";
}

function atomLink(block: string): string {
  // Prefer rel="alternate"; else first <link href>.
  const alt = block.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i);
  if (alt) return alt[1];
  const any = block.match(/<link[^>]*href=["']([^"']+)["']/i);
  return any ? any[1] : "";
}

// A thumbnail URL for the item, from (in order) media:content / media:thumbnail,
// an image <enclosure>, or the first <img> embedded in the content HTML.
function imageFrom(block: string): string {
  let m =
    block.match(/<media:(?:content|thumbnail)[^>]*\burl=["']([^"']+)["']/i) ||
    block.match(/<enclosure[^>]*\burl=["']([^"']+)["'][^>]*type=["']image\//i) ||
    block.match(/<enclosure[^>]*type=["']image\/[^"']*["'][^>]*\burl=["']([^"']+)["']/i) ||
    block.match(/<img[^>]*\bsrc=["']([^"']+)["']/i);
  let url = m ? m[1].trim() : "";
  if (url.startsWith("//")) url = "https:" + url;
  return /^https?:\/\//i.test(url) ? url : "";
}

// The publication's own logo, from the channel-level <image><url> (RSS) or
// <logo>/<icon> (Atom). Falls back to the site's favicon via Google's service.
function channelLogo(xml: string, feedUrl: string): string {
  const head = xml.split(/<item[\s>]|<entry[\s>]/i)[0];
  const m =
    head.match(/<image>[\s\S]*?<url>\s*([^<\s]+)\s*<\/url>/i) ||
    head.match(/<logo>\s*([^<\s]+)\s*<\/logo>/i) ||
    head.match(/<icon>\s*([^<\s]+)\s*<\/icon>/i);
  let u = m ? m[1].trim() : "";
  if (u.startsWith("//")) u = "https:" + u;
  if (/^https?:\/\//i.test(u)) return u;
  try {
    return `https://www.google.com/s2/favicons?sz=128&domain=${new URL(feedUrl).hostname}`;
  } catch {
    return "";
  }
}

function parseFeed(xml: string, source: string, sourceLogo: string): NewsItem[] {
  const out: NewsItem[] = [];
  const isAtom = /<feed[\s>]/i.test(xml) && !/<rss[\s>]/i.test(xml);
  const blocks = xml.match(
    isAtom ? /<entry[\s>][\s\S]*?<\/entry>/gi : /<item[\s>][\s\S]*?<\/item>/gi
  );
  if (!blocks) return out;
  for (const b of blocks.slice(0, PER_FEED)) {
    const title = decode(tag(b, "title"));
    let link = isAtom ? atomLink(b) : decode(tag(b, "link"));
    if (!link) {
      const g = b.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i);
      if (g && /^https?:/i.test(g[1].trim())) link = g[1].trim();
    }
    const rawDate =
      tag(b, "pubDate") || tag(b, "updated") || tag(b, "published") || tag(b, "dc:date");
    const d = rawDate ? new Date(rawDate.trim()) : null;
    const date = d && !isNaN(d.getTime()) ? d.toISOString() : "";
    const descSrc =
      tag(b, "description") || tag(b, "summary") || tag(b, "content:encoded") || tag(b, "content");
    const excerpt = decode(descSrc).slice(0, 220).replace(/\s+\S*$/, "") + "…";
    const image = imageFrom(b);
    if (title && link) out.push({ title, link: link.trim(), source, date, excerpt, image, sourceLogo });
  }
  return out;
}

async function fetchFeed(url: string, source: string): Promise<NewsItem[]> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 7000);
    const res = await fetch(url, {
      headers: { "User-Agent": "OOHsourceBot/1.0 (+https://oohsource.com)", Accept: "application/rss+xml, application/xml, text/xml, */*" },
      next: { revalidate: REVALIDATE },
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) return [];
    const xml = await res.text();
    return parseFeed(xml, source, SOURCE_LOGOS[source] || channelLogo(xml, url));
  } catch {
    return [];
  }
}

// Confirms an image actually loads as an image over HTTPS (the URL the browser
// will request on our secure page). Returns the usable https URL, or "" if it
// 404s / redirects to HTML / is hotlink-blocked / http-only. This is what makes
// "no displayable photo → drop the article" reliable.
async function validImage(url: string): Promise<string> {
  const https = url.replace(/^http:\/\//i, "https://");
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(https, {
      headers: { "User-Agent": "OOHsourceBot/1.0 (+https://oohsource.com)", Accept: "image/*", Range: "bytes=0-2048" },
      redirect: "follow",
      signal: ctrl.signal,
      next: { revalidate: REVALIDATE },
    });
    clearTimeout(t);
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    return res.ok && ct.startsWith("image/") ? https : "";
  } catch {
    return "";
  }
}

export async function getIndustryNews(): Promise<NewsItem[]> {
  const batches = await Promise.all(FEEDS.map((f) => fetchFeed(f.url, f.source)));
  const seen = new Set<string>();
  const items: NewsItem[] = [];
  for (const batch of batches) {
    for (const it of batch) {
      const key = it.link.replace(/[?#].*$/, "").toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(it);
    }
  }
  // Keep only stories whose article image genuinely loads over https — no
  // logo-only cards, no broken/hotlink-blocked thumbnails.
  const withPics = items.filter((it) => it.image);
  const validated = (
    await Promise.all(
      withPics.map(async (it) => {
        const good = await validImage(it.image);
        return good ? { ...it, image: good } : null;
      })
    )
  ).filter((x): x is NewsItem => x !== null);
  validated.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  return validated.slice(0, MAX_ITEMS);
}

export const NEWS_SOURCES = Array.from(new Set(FEEDS.map((f) => f.source)));
