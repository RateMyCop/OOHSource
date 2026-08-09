import { NextResponse } from "next/server";
import {
  fetchVendorIdMap,
  updateAirtableRecords,
  createAirtableRecords,
} from "@/lib/airtable";

export const dynamic = "force-dynamic";

// Secured bulk-update endpoint. Matches incoming records to Vendors by Slug and
// patches the given fields. Auth via the ADMIN_KEY env var (x-admin-key header).
export async function POST(req: Request) {
  const key = (req.headers.get("x-admin-key") || "").trim();
  const configured = (process.env.ADMIN_KEY || "").trim();
  if (!configured || key !== configured) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    records?: { slug?: string; fields?: Record<string, unknown> }[];
    create?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const incoming = Array.isArray(body.records) ? body.records : [];
  if (incoming.length === 0) {
    return NextResponse.json({ error: "No records provided" }, { status: 400 });
  }

  // When ?create=1 (or body.create), records whose slug isn't found are created
  // instead of skipped. Otherwise it's update-only.
  const allowCreate =
    new URL(req.url).searchParams.get("create") === "1" || body.create === true;

  try {
    const idMap = await fetchVendorIdMap();
    const updates: { id: string; fields: Record<string, unknown> }[] = [];
    const creates: Record<string, unknown>[] = [];
    const missing: string[] = [];

    for (const rec of incoming) {
      const slug = String(rec.slug ?? "").trim();
      const fields = rec.fields ?? {};
      if (!slug || Object.keys(fields).length === 0) continue;
      const id = idMap[slug];
      if (id) {
        updates.push({ id, fields });
      } else if (allowCreate) {
        creates.push({ ...fields, Slug: slug });
      } else {
        missing.push(slug);
      }
    }

    await updateAirtableRecords(updates);
    const created = creates.length ? await createAirtableRecords(creates) : 0;

    return NextResponse.json({
      ok: true,
      updated: updates.length,
      created,
      missing,
    });
  } catch (e) {
    console.error("[oohsource] admin update failed:", e);
    return NextResponse.json({ error: String(e).slice(0, 300) }, { status: 500 });
  }
}
