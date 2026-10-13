import { NextResponse } from "next/server";
import {
  activateBoost,
  deactivateBoost,
  describePageKey,
  readBoostsCached,
} from "@/lib/boosts";
import { getVendorBySlug } from "@/lib/vendors";

export const dynamic = "force-dynamic";

function authed(req: Request): boolean {
  const key = (req.headers.get("x-admin-key") || "").trim();
  const configured = (process.env.ADMIN_KEY || "").trim();
  return Boolean(configured) && key === configured;
}

// Admin-only: list every active boost (page -> slugs + expiry).
export async function GET(req: Request) {
  if (!authed(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const map = await readBoostsCached(0);
  return NextResponse.json({ ok: true, boosts: map });
}

// Admin-only: grant or revoke a per-page #1 Boost without going through Stripe
// (comped boosts, offline-sold boosts, or quick fixes).
// Body: { slug, pageKey, action: "activate" | "deactivate", days? }
export async function POST(req: Request) {
  if (!authed(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: { slug?: unknown; pageKey?: unknown; action?: unknown; days?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
  }

  const slug = String(body.slug ?? "").trim();
  const pageKey = String(body.pageKey ?? "").trim();
  const action = String(body.action ?? "activate").trim();

  if (!slug) {
    return NextResponse.json({ ok: false, error: "slug required" }, { status: 400 });
  }
  const page = describePageKey(pageKey);
  if (!page) {
    return NextResponse.json({ ok: false, error: "invalid pageKey" }, { status: 400 });
  }

  if (action === "deactivate") {
    await deactivateBoost(slug, pageKey);
    return NextResponse.json({ ok: true, action, slug, pageKey });
  }

  const vendor = await getVendorBySlug(slug);
  if (!vendor) {
    return NextResponse.json({ ok: false, error: "unknown listing" }, { status: 404 });
  }
  const days = Number(body.days);
  const ttlDays = Number.isFinite(days) && days > 0 ? days : 400;
  const until = Date.now() + ttlDays * 24 * 60 * 60 * 1000;
  await activateBoost(slug, pageKey, until);
  return NextResponse.json({
    ok: true,
    action: "activate",
    slug,
    pageKey,
    page: page.label,
    expires: new Date(until).toISOString(),
  });
}
