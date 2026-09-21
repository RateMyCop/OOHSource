import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import {
  fetchAirtableVendors,
  fetchVendorIdMap,
  updateAirtableRecords,
} from "@/lib/airtable";
import { refreshVendorSnapshot } from "@/lib/vendors";
import type { Vendor } from "@/lib/types";

// Media health for vendor listings. Two jobs, both idempotent and safe to
// re-run, both driven by the Sep 2026 Screaming Frog / Semrush crawls:
//
//   ?mode=gallery  Gallery images are hotlinked from vendor sites and rot
//                  (hashed asset names change, sites move). Crawlers count
//                  every one as a broken external image on OUR page. HEAD-check
//                  each URL and drop the ones that are definitively gone
//                  (404 / 410 / dead hostname). Bot-blocked (403), auth (401)
//                  and server errors (5xx) are kept — they usually work for
//                  people.
//
//   ?mode=hero     ~700 hero images are mShots screenshots served from
//                  s.wordpress.com, which robots.txt-blocks crawlers and
//                  answers with a 307 — so Google never sees the hero or the
//                  og:image for most profiles. Copy each finished screenshot
//                  into our Vercel Blob store and point "Hero Image" at it.
//                  Screenshots mShots hasn't rendered yet come back as a tiny
//                  placeholder; those are skipped and picked up next run.
//
// Auth: header x-admin-key must match ADMIN_KEY.
// Query params:
//   ?mode=gallery|hero   (required)
//   ?dry=1               -> report what would change, write nothing
//   ?limit=N             -> max vendors to process this call (default 25)
//   ?after=<slug>        -> cursor: only vendors whose slug sorts after this
//   ?slug=<slug>         -> just one vendor
//
// Each call returns `next` (the last slug looked at) so a runner can page
// through the whole directory without re-checking what it already did.

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36 OOHsource-media-check";

function authorized(req: NextRequest): boolean {
  const key = (req.headers.get("x-admin-key") || "").trim();
  const configured = (process.env.ADMIN_KEY || "").trim();
  return Boolean(configured) && key === configured;
}

async function withTimeout<T>(p: Promise<T>, ms: number, ctl: AbortController): Promise<T> {
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    return await p;
  } finally {
    clearTimeout(t);
  }
}

type Verdict = "alive" | "dead" | "unsure";

// "dead" only on evidence the resource is gone for everyone, not just for us.
async function checkImage(url: string): Promise<{ verdict: Verdict; status: number | string }> {
  const ctl = new AbortController();
  try {
    let res = await withTimeout(
      fetch(url, { method: "HEAD", redirect: "follow", headers: { "user-agent": UA }, signal: ctl.signal }),
      10_000,
      ctl
    );
    // Some hosts reject HEAD outright; confirm with a ranged GET before judging.
    if (res.status === 405 || res.status === 501 || res.status === 400) {
      const ctl2 = new AbortController();
      res = await withTimeout(
        fetch(url, {
          method: "GET",
          redirect: "follow",
          headers: { "user-agent": UA, range: "bytes=0-0" },
          signal: ctl2.signal,
        }),
        10_000,
        ctl2
      );
    }
    if (res.status === 404 || res.status === 410) return { verdict: "dead", status: res.status };
    if (res.ok || res.status === 206) return { verdict: "alive", status: res.status };
    return { verdict: "unsure", status: res.status };
  } catch (e) {
    const msg = String((e as { cause?: { code?: string } })?.cause?.code || (e as Error)?.message || e);
    // Hostname no longer resolves: the whole site is gone.
    if (/ENOTFOUND|EAI_AGAIN|ERR_NAME_NOT_RESOLVED|getaddrinfo/i.test(msg)) {
      return { verdict: "dead", status: msg.slice(0, 40) };
    }
    return { verdict: "unsure", status: msg.slice(0, 40) };
  }
}

function isMshots(url: string | undefined): boolean {
  return /^https?:\/\/s\.wordpress\.com\/mshots\//i.test(url || "");
}

// Fetch a finished mShots screenshot. Returns null while mShots is still
// rendering it (it answers with a small placeholder image until then).
async function fetchScreenshot(url: string): Promise<{ bytes: ArrayBuffer; type: string } | null> {
  const ctl = new AbortController();
  const res = await withTimeout(
    fetch(url, { redirect: "follow", headers: { "user-agent": UA }, signal: ctl.signal }),
    20_000,
    ctl
  );
  if (!res.ok) return null;
  const type = (res.headers.get("content-type") || "").toLowerCase();
  if (!type.startsWith("image/jpeg") && !type.startsWith("image/png") && !type.startsWith("image/webp")) {
    return null;
  }
  const bytes = await res.arrayBuffer();
  // Finished 1200x675 page screenshots are tens of kB; the "rendering"
  // placeholder is a few kB. Anything under 12 kB is not a real screenshot.
  if (bytes.byteLength < 12_000) return null;
  return { bytes, type };
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sp = req.nextUrl.searchParams;
  const mode = sp.get("mode");
  if (mode !== "gallery" && mode !== "hero") {
    return NextResponse.json({ error: "mode must be gallery or hero" }, { status: 400 });
  }
  const dry = sp.get("dry") === "1";
  const limit = Math.max(1, Math.min(200, Number(sp.get("limit") || 25)));
  const after = (sp.get("after") || "").trim();
  const only = (sp.get("slug") || "").trim();

  let vendors: Vendor[];
  try {
    vendors = await fetchAirtableVendors();
  } catch (e) {
    return NextResponse.json({ error: `Airtable read failed: ${String(e).slice(0, 200)}` }, { status: 502 });
  }

  const candidates = vendors
    .filter((v) => (only ? v.slug === only : true))
    .filter((v) => (after ? v.slug > after : true))
    .filter((v) => (mode === "gallery" ? (v.gallery?.length ?? 0) > 0 : isMshots(v.heroImage)))
    .sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));

  const batch = candidates.slice(0, limit);
  const remaining = Math.max(0, candidates.length - batch.length);
  const updates: { id: string; fields: Record<string, unknown> }[] = [];
  const report: Record<string, unknown>[] = [];
  let idMap: Record<string, string> = {};
  if (!dry && batch.length) idMap = await fetchVendorIdMap();

  if (mode === "gallery") {
    for (const v of batch) {
      const urls = v.gallery || [];
      const results = await Promise.all(urls.map((u) => checkImage(u)));
      const keep = urls.filter((_, i) => results[i].verdict !== "dead");
      const dropped = urls.filter((_, i) => results[i].verdict === "dead");
      if (dropped.length) {
        report.push({
          slug: v.slug,
          dropped: dropped.map((u, i) => ({ url: u, status: results[urls.indexOf(u)].status })),
          kept: keep.length,
        });
        const id = idMap[v.slug];
        if (!dry && id) updates.push({ id, fields: { Gallery: keep.join("\n") } });
      }
    }
  } else {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token && !dry) {
      return NextResponse.json({ error: "BLOB_READ_WRITE_TOKEN is not configured" }, { status: 500 });
    }
    for (const v of batch) {
      const src = v.heroImage!;
      try {
        const shot = await fetchScreenshot(src);
        if (!shot) {
          report.push({ slug: v.slug, result: "not-ready" });
          continue;
        }
        if (dry) {
          report.push({ slug: v.slug, result: "would-rehost", bytes: shot.bytes.byteLength });
          continue;
        }
        const ext = shot.type.startsWith("image/png") ? "png" : shot.type.startsWith("image/webp") ? "webp" : "jpg";
        const blob = await put(`heroes/${v.slug}.${ext}`, shot.bytes, {
          access: "public",
          token,
          contentType: shot.type.split(";")[0],
          addRandomSuffix: false,
          allowOverwrite: true,
          cacheControlMaxAge: 60 * 60 * 24 * 365,
        });
        const id = idMap[v.slug];
        if (id) updates.push({ id, fields: { "Hero Image": blob.url } });
        report.push({ slug: v.slug, result: "rehosted", url: blob.url, bytes: shot.bytes.byteLength });
      } catch (e) {
        report.push({ slug: v.slug, result: "error", error: String(e).slice(0, 160) });
      }
    }
  }

  let written = 0;
  if (!dry && updates.length) {
    try {
      await updateAirtableRecords(updates);
      written = updates.length;
      // Make the change visible now rather than at the next snapshot cron.
      try {
        await refreshVendorSnapshot();
      } catch (e) {
        console.error("[oohsource] media-health snapshot refresh failed:", e);
      }
      for (const u of updates) {
        const slug = batch.find((v) => idMap[v.slug] === u.id)?.slug;
        if (slug) revalidatePath(`/directory/${slug}`);
      }
    } catch (e) {
      return NextResponse.json(
        { error: `Airtable write failed: ${String(e).slice(0, 200)}`, report },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    ok: true,
    mode,
    dry,
    checked: batch.length,
    changed: report.length,
    written,
    remaining,
    next: batch.length ? batch[batch.length - 1].slug : null,
    report,
  });
}
