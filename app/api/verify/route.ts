import { NextResponse } from "next/server";
import {
  findRecordIdByToken,
  findClaimByToken,
  findVendorRecordIdBySlug,
  updateAirtableRecord,
} from "@/lib/airtable";

export const dynamic = "force-dynamic";

// Completes email/claim confirmation. POST-only (from the button on /verify) so
// link-scanning email security can't consume the token by pre-fetching.
export async function POST(req: Request) {
  const origin = new URL(req.url).origin;
  let token = "";
  let isClaim = false;
  try {
    const form = await req.formData();
    token = String(form.get("token") || "");
    isClaim = String(form.get("type") || "") === "claim";
  } catch {
    /* fall through to invalid */
  }
  const suffix = isClaim ? "&type=claim" : "";
  const back = (state: string) =>
    NextResponse.redirect(new URL(`/verify?state=${state}${suffix}`, origin), {
      status: 303,
    });

  if (!token) return back("invalid");
  try {
    if (isClaim) {
      const claim = await findClaimByToken(token);
      if (!claim) return back("invalid");
      await updateAirtableRecord(
        claim.id,
        { Status: "Email confirmed", "Verify Token": "" },
        "Claims"
      );
      // A domain-matched confirmation is our verification bar — badge the
      // listing automatically so the owner's profile reflects it right away.
      // Best-effort: never fail the confirmation if this lookup/update trips.
      if (claim.domainMatch && claim.slug) {
        try {
          const vendorId = await findVendorRecordIdBySlug(claim.slug);
          if (vendorId) {
            await updateAirtableRecord(vendorId, { Verified: true });
          }
        } catch (e) {
          console.error("[oohsource] auto-verify listing failed:", e);
        }
      }
      return back("ok");
    } else {
      const id = await findRecordIdByToken(token);
      if (!id) return back("invalid");
      await updateAirtableRecord(id, {
        Status: "Pending Review",
        "Verify Token": "",
      });
    }
    return back("ok");
  } catch (e) {
    console.error("[oohsource] verify failed:", e);
    return back("error");
  }
}
