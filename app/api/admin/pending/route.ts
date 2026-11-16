import { NextResponse } from "next/server";
import { fetchPendingVendors, publishVendor } from "@/lib/airtable";

export const dynamic = "force-dynamic";

function authed(req: Request): boolean {
  const key = (req.headers.get("x-admin-key") || "").trim();
  return Boolean(process.env.ADMIN_KEY) && key === process.env.ADMIN_KEY!.trim();
}

// Publish a pending submission by record id (sets Status="Published").
// Body: { id }. Auth: x-admin-key. (The /admin UI button is session-gated; this
// is the headless equivalent.)
export async function POST(req: Request) {
  if (!authed(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
  }
  const id = String(body.id ?? "").trim();
  if (!id) {
    return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
  }
  try {
    await publishVendor(id);
    return NextResponse.json({ ok: true, published: id });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e).slice(0, 300) },
      { status: 500 }
    );
  }
}

// Read-only view of the submission review queue (any Status set and not
// "Published"), so pending/unconfirmed listings can be inspected without the
// owner-login admin UI. Optional ?q= filters by company name, submitter email,
// or slug. Auth: x-admin-key.
export async function GET(req: Request) {
  const key = (req.headers.get("x-admin-key") || "").trim();
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY.trim()) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const q = (new URL(req.url).searchParams.get("q") || "").trim().toLowerCase();
  try {
    let rows = await fetchPendingVendors(100);
    if (q) {
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.submitter.toLowerCase().includes(q) ||
          r.slug.toLowerCase().includes(q)
      );
    }
    return NextResponse.json({ ok: true, count: rows.length, rows });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e).slice(0, 300) },
      { status: 500 }
    );
  }
}
