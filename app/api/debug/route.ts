import { NextResponse } from "next/server";
import { airtableConfigured, fetchAirtableVendors } from "@/lib/airtable";

// TEMPORARY diagnostic endpoint. Reports whether Airtable is wired up.
// Does NOT expose the token. Remove after debugging.
export const dynamic = "force-dynamic";

export async function GET() {
  const configured = airtableConfigured();
  const envSeen = {
    hasToken: Boolean(process.env.AIRTABLE_TOKEN),
    hasBaseId: Boolean(process.env.AIRTABLE_BASE_ID),
    tableName: process.env.AIRTABLE_TABLE_NAME || "(default: Vendors)",
  };

  if (!configured) {
    return NextResponse.json({
      source: "seed (fallback)",
      reason: "AIRTABLE_TOKEN and/or AIRTABLE_BASE_ID not present in this deployment",
      envSeen,
    });
  }

  try {
    const vendors = await fetchAirtableVendors();
    return NextResponse.json({
      source: "airtable",
      ok: true,
      count: vendors.length,
      firstThree: vendors.slice(0, 3).map((v) => v.name),
      envSeen,
    });
  } catch (e) {
    return NextResponse.json({
      source: "error (falls back to seed)",
      error: String(e).slice(0, 400),
      envSeen,
    });
  }
}
