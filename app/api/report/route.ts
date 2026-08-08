import { NextResponse } from "next/server";
import { airtableConfigured, createAirtableRecord } from "@/lib/airtable";

export const dynamic = "force-dynamic";

const REPORTS_TABLE = process.env.AIRTABLE_REPORTS_TABLE || "Reports";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot
  if (typeof body.company_url === "string" && body.company_url.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const details = String(body.details ?? "").trim();
  if (!details) {
    return NextResponse.json(
      { error: "Please describe the issue." },
      { status: 400 }
    );
  }

  if (!airtableConfigured()) {
    return NextResponse.json(
      { error: "Reporting is temporarily unavailable. Please try again later." },
      { status: 503 }
    );
  }

  const fields: Record<string, unknown> = {
    Vendor: String(body.vendor ?? "").trim(),
    "Vendor Slug": String(body.vendorSlug ?? "").trim(),
    "Issue Type": String(body.issueType ?? "Other").trim(),
    Details: details,
    "Reporter Email": String(body.email ?? "").trim(),
    Status: "New",
  };

  try {
    await createAirtableRecord(fields, REPORTS_TABLE);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[oohsource] report failed:", e);
    return NextResponse.json(
      { error: "Something went wrong sending your report. Please try again." },
      { status: 500 }
    );
  }
}
