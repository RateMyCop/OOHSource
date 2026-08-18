import { NextResponse } from "next/server";
import { fetchClaims } from "@/lib/airtable";

export const dynamic = "force-dynamic";

// Admin-key GET: recent listing claims (company, email, status, domain match,
// created time). Used to see who has claimed / verified their listing.
export async function GET(req: Request) {
  const key = (req.headers.get("x-admin-key") || "").trim();
  const configured = (process.env.ADMIN_KEY || "").trim();
  if (!configured || key !== configured) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const claims = await fetchClaims(200);
    return NextResponse.json({ ok: true, count: claims.length, claims });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 }
    );
  }
}
