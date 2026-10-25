// Verified-crawler IP handling for the anti-scrape middleware.
//
// Good bots are allow-listed by their PUBLISHED IP ranges (spoof-proof) where the
// provider publishes them, and by user-agent for the few that don't. Everything
// else is rate-limited. Pure JS (BigInt) + fetch only, so it runs in both the
// Node cron and the Edge middleware.

// Bots whose IP ranges we fetch and verify (UA claiming these but from an
// unverified IP = treated as a spoofer → rate-limited).
export const VERIFIABLE_BOT_UA =
  /(googlebot|bingbot|gptbot|oai-searchbot|chatgpt-user|perplexitybot)/i;

// Legit AI/search bots that don't publish clean IP lists — trusted by UA.
export const UNVERIFIABLE_BOT_UA =
  /(claudebot|claude-web|anthropic-ai|ccbot|amazonbot|applebot|cohere-ai|google-extended|duckduckbot|bingpreview)/i;

// Published IP-range endpoints (all use the {prefixes:[{ipv4Prefix|ipv6Prefix}]}
// schema; parser also falls back to scraping CIDR-looking strings).
const SOURCES = [
  "https://developers.google.com/static/search/apis/ipranges/googlebot.json",
  "https://developers.google.com/static/search/apis/ipranges/special-crawlers.json",
  "https://www.bing.com/toolbox/bingbot.json",
  "https://openai.com/gptbot.json",
  "https://openai.com/searchbot.json",
  "https://openai.com/chatgpt-user.json",
  "https://www.perplexity.ai/perplexitybot.json",
];

export async function fetchAllBotCidrs(): Promise<string[]> {
  const set = new Set<string>();
  await Promise.all(
    SOURCES.map(async (u) => {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 8000);
        const r = await fetch(u, {
          headers: { "User-Agent": "OOHsourceBot/1.0 (+https://oohsource.com)" },
          signal: ctrl.signal,
        });
        clearTimeout(t);
        if (!r.ok) return;
        const j = (await r.json()) as Record<string, unknown>;
        const prefixes = (j.prefixes || (j.data as Record<string, unknown>)?.prefixes || []) as Array<
          Record<string, string>
        >;
        let found = 0;
        for (const p of Array.isArray(prefixes) ? prefixes : []) {
          const c = p.ipv4Prefix || p.ipv6Prefix || p.prefix || p.cidr;
          if (typeof c === "string" && c.includes("/")) {
            set.add(c.trim());
            found++;
          }
        }
        if (!found) {
          const m =
            JSON.stringify(j).match(
              /\d{1,3}(?:\.\d{1,3}){3}\/\d{1,2}|[0-9a-fA-F:]+:[0-9a-fA-F:]*\/\d{1,3}/g
            ) || [];
          m.forEach((x) => set.add(x));
        }
      } catch {
        /* skip a failed source */
      }
    })
  );
  return Array.from(set);
}

export type ParsedCidr = { v6: boolean; base: bigint; mask: bigint };

function ipToBig(ipRaw: string): { v6: boolean; val: bigint } | null {
  const ip = (ipRaw || "").trim().split("%")[0];
  if (!ip) return null;
  if (ip.includes(":")) {
    const halves = ip.split("::");
    if (halves.length > 2) return null;
    const expandV4 = (g: string): string[] => {
      if (g.includes(".")) {
        const o = g.split(".").map(Number);
        if (o.length === 4 && o.every((n) => n >= 0 && n <= 255))
          return [
            (((o[0] << 8) | o[1]) >>> 0).toString(16),
            (((o[2] << 8) | o[3]) >>> 0).toString(16),
          ];
      }
      return [g];
    };
    let head = halves[0] ? halves[0].split(":").flatMap(expandV4) : [];
    let tail = halves.length === 2 && halves[1] ? halves[1].split(":").flatMap(expandV4) : [];
    const missing = 8 - (head.length + tail.length);
    if (missing < 0) return null;
    const groups = [...head, ...Array(Math.max(0, missing)).fill("0"), ...tail];
    if (groups.length !== 8) return null;
    let val = BigInt(0);
    for (const g of groups) {
      const n = parseInt(g || "0", 16);
      if (Number.isNaN(n) || n < 0 || n > 0xffff) return null;
      val = (val << BigInt(16)) + BigInt(n);
    }
    return { v6: true, val };
  }
  const o = ip.split(".");
  if (o.length !== 4) return null;
  let val = BigInt(0);
  for (const p of o) {
    const n = Number(p);
    if (!Number.isInteger(n) || n < 0 || n > 255) return null;
    val = (val << BigInt(8)) + BigInt(n);
  }
  return { v6: false, val };
}

export function parseCidrs(cidrs: string[]): ParsedCidr[] {
  const out: ParsedCidr[] = [];
  for (const c of cidrs) {
    const [ipStr, lenStr] = c.split("/");
    const b = ipToBig(ipStr);
    if (!b) continue;
    const total = b.v6 ? 128 : 32;
    const len = lenStr ? parseInt(lenStr, 10) : total;
    if (!(len >= 0 && len <= total)) continue;
    const mask = len === 0 ? BigInt(0) : ((BigInt(1) << BigInt(len)) - BigInt(1)) << BigInt(total - len);
    out.push({ v6: b.v6, base: b.val & mask, mask });
  }
  return out;
}

export function ipInParsed(ip: string, parsed: ParsedCidr[]): boolean {
  const b = ipToBig(ip);
  if (!b) return false;
  for (const p of parsed) {
    if (p.v6 !== b.v6) continue;
    if ((b.val & p.mask) === p.base) return true;
  }
  return false;
}
