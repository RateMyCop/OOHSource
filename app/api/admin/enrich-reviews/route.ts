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
// Auth: header x-admin-key must match ADMIN_KEY.
// Query params:
//   ?dry=1        -> look things up but don't write to Airtable (preview)
//   ?limit=N      -> only process the first N vendors (testing)
//   ?slug=foo     -> only process one vendor by slug (testing)
//   ?source=google|yelp|both  (default: both if YELP_API_KEY set, else google)

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Found = { rating?: number; count?: number; name?: string; error?: string };

async function googlePlace(query: string, key: string): Promise<Found> {
  try {
    const res = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": key,
          "X-Goog-FieldMask":
            "places.displayName,places.rating,places.userRatingCount",
        },
        body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
        cache: "no-store",
      }
    );
    if (!res.ok) return { error: `google ${res.status}: ${await res.text()}` };
    const data = (await res.json()) as {
      places?: {
        rating?: number;
        userRatingCount?: number;
        displayName?: { text?: string };
      }[];
    };
    const p = data.places?.[0];
    if (!p) return {};
    return {
      rating: p.rating,
      count: p.userRatingCount,
      name: p.displayName?.text,
    };
  } catch (e) {
    return { error: `google fetch failed: ${(e as Error).message}` };
  }
}

async function yelpBusiness(
  name: string,
  location: string,
  key: string
): Promise<Found> {
  try {
    const url = new URL("https://api.yelp.com/v3/businesses/search");
    url.searchParams.set("term", name);
    url.searchParams.set("location", location || "United States");
    url.searchParams.set("limit", "1");
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (!res.ok) return { error: `yelp ${res.status}: ${await res.text()}` };
    const data = (await res.json()) as {
      businesses?: { name?: string; rating?: number; review_count?: number }[];
    };
    const b = data.businesses?.[0];
    if (!b) return {};
    return { rating: b.rating, count: b.review_count, name: b.name };
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
  const limit = Number(searchParams.get("limit") || "0");
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
    const fields: Record<string, unknown> = {};
    const row: Record<string, unknown> = { slug: v.slug, name: v.name };

    if (doGoogle) {
      const g = await googlePlace(query, gKey);
      if (g.error) row.googleError = g.error;
      if (typeof g.rating === "number") {
        fields["Google Rating"] = g.rating;
        row.googleRating = g.rating;
        row.googleMatch = g.name;
      }
      if (typeof g.count === "number") fields["Google Reviews"] = g.count;
    }

    if (doYelp) {
      const y = await yelpBusiness(v.name, v.location, yKey);
      if (y.error) row.yelpError = y.error;
      if (typeof y.rating === "number") {
        fields["Yelp Rating"] = y.rating;
        row.yelpRating = y.rating;
        row.yelpMatch = y.name;
      }
      if (typeof y.count === "number") fields["Yelp Reviews"] = y.count;
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
    processed: vendors.length,
    matched: updates.length,
    updated,
    sources: { google: Boolean(doGoogle), yelp: Boolean(doYelp) },
    results,
  });
}
