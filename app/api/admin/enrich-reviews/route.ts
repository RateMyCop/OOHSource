import { NextRequest, NextResponse } from "next/server";
import {
  fetchAirtableVendors,
  fetchVendorIdMap,
  updateAirtableRecords,
} from "@/lib/airtable";

// Server-side review enrichment. Reads GOOGLE_PLACES_API_KEY (and optionally
// YELP_API_KEY) from the environment — the keys never leave the server. For
// each vendor it looks up the business on Google (and Yelp) and writes the
// rating + review count back to Airtable.
//
// Match validation: Google text search will happily return a same-named but
// unrelated business, so a candidate is only accepted when its website domain
// matches the vendor's website domain, OR its name is a strong token match —
// AND it has at least `minReviews` reviews. This avoids writing a random
// namesake's rating onto a vendor profile.
//
// Auth: header x-admin-key must match ADMIN_KEY.
// Query params:
//   ?dry=1            -> look things up but don't write to Airtable (preview)
//   ?limit=N          -> only process the first N vendors
//   ?slug=foo         -> only process one vendor by slug
//   ?minReviews=N     -> minimum review count to accept (default 3)
//   ?source=google|yelp|both
//   ?relax=1          -> accept name-only matches even without a domain match

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function domainOf(url: string): string {
  if (!url) return "";
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

// Registrable-ish domain: last two labels (good enough for .com/.net/.io etc.)
function regDomain(host: string): string {
  const parts = host.split(".");
  return parts.length > 2 ? parts.slice(-2).join(".") : host;
}

const NAME_STOP = new Set([
  "the", "and", "a", "of", "inc", "llc", "ltd", "co", "company", "corp",
  "corporation", "group", "media", "advertising", "outdoor", "signs", "sign",
  "graphics", "printing", "usa", "productions", "production", "studio",
]);

function nameTokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((t) => t && !NAME_STOP.has(t));
}

function uniq(arr: string[]): string[] {
  return arr.filter((t, i) => arr.indexOf(t) === i);
}

function nameMatch(vendorName: string, candidate: string): boolean {
  const a = uniq(nameTokens(vendorName));
  const b = uniq(nameTokens(candidate));
  if (a.length === 0 || b.length === 0) return false;
  const overlap = a.filter((t) => b.indexOf(t) !== -1).length;
  // Every distinctive vendor token appears in the candidate, or strong Jaccard.
  const unionSize = uniq(a.concat(b)).length;
  const jaccard = overlap / unionSize;
  return overlap === a.length || jaccard >= 0.6;
}

type Cand = {
  rating?: number;
  count?: number;
  name?: string;
  website?: string;
};

type Found = {
  rating?: number;
  count?: number;
  name?: string;
  website?: string;
  accepted?: boolean;
  reason?: string;
  error?: string;
};

async function googlePlace(
  query: string,
  vendorDomain: string,
  vendorName: string,
  key: string,
  relax: boolean
): Promise<Found> {
  try {
    const res = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": key,
          "X-Goog-FieldMask":
            "places.displayName,places.rating,places.userRatingCount,places.websiteUri",
        },
        body: JSON.stringify({ textQuery: query, maxResultCount: 3 }),
        cache: "no-store",
      }
    );
    if (!res.ok) return { error: `google ${res.status}: ${await res.text()}` };
    const data = (await res.json()) as {
      places?: {
        rating?: number;
        userRatingCount?: number;
        displayName?: { text?: string };
        websiteUri?: string;
      }[];
    };
    const places = data.places ?? [];
    if (places.length === 0) return { reason: "no results" };

    const cands: Cand[] = places.map((p) => ({
      rating: p.rating,
      count: p.userRatingCount,
      name: p.displayName?.text,
      website: p.websiteUri,
    }));

    const vReg = vendorDomain ? regDomain(vendorDomain) : "";
    // Prefer a candidate whose domain matches the vendor's.
    const byDomain = vReg
      ? cands.find((c) => c.website && regDomain(domainOf(c.website)) === vReg)
      : undefined;

    if (byDomain) {
      return {
        rating: byDomain.rating,
        count: byDomain.count,
        name: byDomain.name,
        website: byDomain.website,
        accepted: true,
        reason: "domain match",
      };
    }

    // No domain match. Name matching alone is unreliable for B2B names (a
    // vendor called "Firefly" matches an airport of the same name), so only
    // accept a name match when the caller explicitly opts in with ?relax=1.
    const top = cands[0];
    const nm = top.name ? nameMatch(vendorName, top.name) : false;
    return {
      rating: top.rating,
      count: top.count,
      name: top.name,
      website: top.website,
      accepted: relax && nm,
      reason: nm
        ? relax
          ? "name match (relaxed)"
          : "name match (not accepted; use relax=1)"
        : "no domain match",
    };
  } catch (e) {
    return { error: `google fetch failed: ${(e as Error).message}` };
  }
}

async function yelpBusiness(
  name: string,
  location: string,
  vendorName: string,
  key: string
): Promise<Found> {
  try {
    const url = new URL("https://api.yelp.com/v3/businesses/search");
    url.searchParams.set("term", name);
    url.searchParams.set("location", location || "United States");
    url.searchParams.set("limit", "3");
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (!res.ok) return { error: `yelp ${res.status}: ${await res.text()}` };
    const data = (await res.json()) as {
      businesses?: { name?: string; rating?: number; review_count?: number }[];
    };
    const b = data.businesses?.[0];
    if (!b) return { reason: "no results" };
    const nm = b.name ? nameMatch(vendorName, b.name) : false;
    return {
      rating: b.rating,
      count: b.review_count,
      name: b.name,
      accepted: nm,
      reason: nm ? "name match" : "no name match",
    };
  } catch (e) {
    return { error: `yelp fetch failed: ${(e as Error).message}` };
  }
}

export async function GET(req: NextRequest) {
  const key = (req.headers.get("x-admin-key") || "").trim();
  const configured = (process.env.ADMIN_KEY || "").trim();
  if (!configured || key !== configured) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const gKey = (process.env.GOOGLE_PLACES_API_KEY || "").trim();
  const yKey = (process.env.YELP_API_KEY || "").trim();

  const { searchParams } = new URL(req.url);
  const dry = searchParams.get("dry") === "1";
  const relax = searchParams.get("relax") === "1";
  const limit = Number(searchParams.get("limit") || "0");
  const minReviews = Number(searchParams.get("minReviews") || "3");
  const onlySlug = (searchParams.get("slug") || "").trim();
  const sourceParam = (searchParams.get("source") || "").trim().toLowerCase();
  const doGoogle = gKey && sourceParam !== "yelp";
  const doYelp = yKey && sourceParam !== "google";

  if (!doGoogle && !doYelp) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "No review source available. Set GOOGLE_PLACES_API_KEY (and optionally YELP_API_KEY) in the environment.",
      },
      { status: 400 }
    );
  }

  let vendors = await fetchAirtableVendors();
  if (onlySlug) vendors = vendors.filter((v) => v.slug === onlySlug);
  if (limit > 0) vendors = vendors.slice(0, limit);

  const idMap = await fetchVendorIdMap();

  const updates: { id: string; fields: Record<string, unknown> }[] = [];
  const results: Record<string, unknown>[] = [];

  for (const v of vendors) {
    const query = [v.name, v.location].filter(Boolean).join(" ");
    const vendorDomain = domainOf(v.website);
    const fields: Record<string, unknown> = {};
    const row: Record<string, unknown> = { slug: v.slug, name: v.name };

    if (doGoogle) {
      const g = await googlePlace(query, vendorDomain, v.name, gKey, relax);
      if (g.error) row.googleError = g.error;
      row.googleRating = g.rating;
      row.googleReviews = g.count;
      row.googleMatch = g.name;
      row.googleReason = g.reason;
      const ok =
        g.accepted &&
        typeof g.rating === "number" &&
        typeof g.count === "number" &&
        g.count >= minReviews;
      row.googleAccepted = Boolean(ok);
      if (ok) {
        fields["Google Rating"] = g.rating;
        fields["Google Reviews"] = g.count;
      }
    }

    if (doYelp) {
      const y = await yelpBusiness(v.name, v.location, v.name, yKey);
      if (y.error) row.yelpError = y.error;
      row.yelpRating = y.rating;
      row.yelpReviews = y.count;
      row.yelpMatch = y.name;
      const ok =
        y.accepted &&
        typeof y.rating === "number" &&
        typeof y.count === "number" &&
        y.count >= minReviews;
      row.yelpAccepted = Boolean(ok);
      if (ok) {
        fields["Yelp Rating"] = y.rating;
        fields["Yelp Reviews"] = y.count;
      }
    }

    const id = idMap[v.slug];
    if (Object.keys(fields).length > 0 && id) {
      updates.push({ id, fields });
    }
    results.push(row);
  }

  let updated = 0;
  if (!dry && updates.length > 0) {
    await updateAirtableRecords(updates);
    updated = updates.length;
  }

  return NextResponse.json({
    ok: true,
    dry,
    minReviews,
    processed: vendors.length,
    matched: updates.length,
    updated,
    sources: { google: Boolean(doGoogle), yelp: Boolean(doYelp) },
    results,
  });
}
