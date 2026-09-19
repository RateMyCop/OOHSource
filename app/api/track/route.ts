import { NextResponse } from "next/server";
import { kvConfigured } from "@/lib/kv";
import { EVENT_SET, Ev, getStats, recordEvent } from "@/lib/stats";
import { recordViewSource } from "@/lib/audience";

// External referring domain, or "" for a direct visit / our own pages.
function refHost(ref: string): string {
  if (!ref) return "";
  try {
    const h = new URL(ref).hostname.toLowerCase().replace(/^www\./, "");
    if (!h || h.endsWith("oohsource.com") || h === "localhost" || h.endsWith(".vercel.app")) return "";
    return h.slice(0, 100);
  } catch {
    return "";
  }
}

// Per-vendor event tracking.
//
//   POST /api/track   { slug, e }   e ∈ view | website | email
//     Fire-and-forget beacon from the browser. Always returns 204 — tracking
//     must never surface an error to the visitor, and no-ops silently when KV
//     isn't configured.
//
//   GET /api/track?slug=X&days=N    (x-admin-key)
//     Totals + per-event daily series (for verification; owner dashboards read
//     the same data via lib/stats directly).

export const dynamic = "force-dynamic";

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,79}$/;
const noContent = () => new NextResponse(null, { status: 204 });

export async function POST(req: Request) {
  let body: { slug?: unknown; e?: unknown; ref?: unknown };
  try {
    body = await req.json();
  } catch {
    return noContent();
  }
  const slug = String(body?.slug ?? "").trim();
  const e = String(body?.e ?? "").trim();
  if (!SLUG_RE.test(slug) || !EVENT_SET.has(e)) return noContent();

  try {
    await recordEvent(slug, e as Ev);
    // On a view, also record where it came from (referrer + country).
    if (e === "view") {
      const host = refHost(String(body?.ref ?? ""));
      const country = (req.headers.get("x-vercel-ip-country") || "").toUpperCase();
      if (host || /^[A-Z]{2}$/.test(country)) {
        await recordViewSource(slug, host, /^[A-Z]{2}$/.test(country) ? country : "");
      }
    }
  } catch (err) {
    console.error("[track] write failed:", err);
  }
  return noContent();
}

export async function GET(req: Request) {
  const key = (req.headers.get("x-admin-key") || "").trim();
  const configured = (process.env.ADMIN_KEY || "").trim();
  if (!configured || key !== configured) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!kvConfigured()) {
    return NextResponse.json({ ok: false, error: "KV not configured" }, { status: 503 });
  }
  const url = new URL(req.url);
  const slug = (url.searchParams.get("slug") || "").trim();
  const days = Math.min(Math.max(Number(url.searchParams.get("days") || "30"), 1), 120);
  if (!SLUG_RE.test(slug)) {
    return NextResponse.json({ ok: false, error: "bad slug" }, { status: 400 });
  }
  const stats = await getStats(slug, days);
  return NextResponse.json({ ok: true, slug, days, ...stats });
}
