import { kv } from "./kv";

// Where a listing's profile views come from — external referrer domains and
// visitor countries — aggregated per slug in KV hashes. Written from the view
// beacon (runtime), read in the dynamic dashboard.

const refKey = (slug: string) => `aud:ref:${slug}`;
const geoKey = (slug: string) => `aud:geo:${slug}`;

export async function recordViewSource(
  slug: string,
  host: string,
  country: string
): Promise<void> {
  const r = kv();
  if (!r) return;
  const tasks: Promise<unknown>[] = [];
  if (host) tasks.push(r.hincrby(refKey(slug), host, 1) as unknown as Promise<unknown>);
  if (country) tasks.push(r.hincrby(geoKey(slug), country, 1) as unknown as Promise<unknown>);
  if (tasks.length) await Promise.all(tasks);
}

export type AudienceRow = { key: string; count: number };
export type Audience = { referrers: AudienceRow[]; countries: AudienceRow[] };

function top(h: Record<string, unknown> | null): AudienceRow[] {
  return Object.entries(h || {})
    .map(([key, count]) => ({ key, count: Number(count) || 0 }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

export async function listAudience(slug: string): Promise<Audience> {
  const r = kv();
  if (!r) return { referrers: [], countries: [] };
  try {
    const [refs, geos] = await Promise.all([
      r.hgetall<Record<string, unknown>>(refKey(slug)),
      r.hgetall<Record<string, unknown>>(geoKey(slug)),
    ]);
    return { referrers: top(refs), countries: top(geos) };
  } catch {
    return { referrers: [], countries: [] };
  }
}
