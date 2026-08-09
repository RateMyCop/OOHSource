import { NextResponse } from "next/server";
import {
  airtableConfigured,
  createAirtableRecord,
  updateAirtableRecord,
} from "@/lib/airtable";
import { getVendorBySlug } from "@/lib/vendors";
import { emailMatchesSite } from "@/lib/domain";
import { emailConfigured, sendClaimVerificationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const CLAIMS_TABLE = process.env.AIRTABLE_CLAIMS_TABLE || "Claims";

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

  const vendorSlug = String(body.vendorSlug ?? "").trim();
  const email = String(body.email ?? "").trim();
  const note = String(body.note ?? "").trim();

  if (!email || email.indexOf("@") < 1) {
    return NextResponse.json(
      { error: "Please enter a valid work email." },
      { status: 400 }
    );
  }
  if (!airtableConfigured()) {
    return NextResponse.json(
      { error: "Claims are temporarily unavailable. Please try again later." },
      { status: 503 }
    );
  }

  // Look up the real vendor (don't trust client-provided name/website).
  const vendor = await getVendorBySlug(vendorSlug);
  if (!vendor) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  const domainMatch = emailMatchesSite(email, vendor.website);

  const baseFields: Record<string, unknown> = {
    Company: vendor.name,
    "Vendor Slug": vendor.slug,
    "Claimant Email": email,
    "Domain Match": domainMatch ? "Yes" : "No",
    Note: note,
  };

  try {
    if (emailConfigured()) {
      const token = crypto.randomUUID();
      let recordId = "";
      try {
        recordId = await createAirtableRecord(
          { ...baseFields, Status: "Pending email", "Verify Token": token },
          CLAIMS_TABLE
        );
      } catch (createErr) {
        console.error(
          "[oohsource] claim create failed, using review queue:",
          createErr
        );
        await createAirtableRecord(
          { ...baseFields, Status: "Needs review" },
          CLAIMS_TABLE
        );
        return NextResponse.json({ ok: true, verify: false, domainMatch });
      }

      try {
        await sendClaimVerificationEmail(email, vendor.name, token);
        return NextResponse.json({ ok: true, verify: true, domainMatch });
      } catch (mailErr) {
        console.error(
          "[oohsource] claim email failed, moving to review queue:",
          mailErr
        );
        if (recordId) {
          await updateAirtableRecord(
            recordId,
            { Status: "Needs review", "Verify Token": "" },
            CLAIMS_TABLE
          );
        }
        return NextResponse.json({ ok: true, verify: false, domainMatch });
      }
    }

    await createAirtableRecord(
      { ...baseFields, Status: "Needs review" },
      CLAIMS_TABLE
    );
    return NextResponse.json({ ok: true, verify: false, domainMatch });
  } catch (e) {
    console.error("[oohsource] claim failed:", e);
    return NextResponse.json(
      { error: "Something went wrong sending your claim. Please try again." },
      { status: 500 }
    );
  }
}
