import { NextResponse } from "next/server";
import { fetchPendingVendors } from "@/lib/airtable";

export const dynamic = "force-dynamic";

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
