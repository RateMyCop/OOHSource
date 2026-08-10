import { NextResponse } from "next/server";
import { findRecordIdByToken, updateAirtableRecord } from "@/lib/airtable";

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
    const table = isClaim ? "Claims" : undefined;
    const id = await findRecordIdByToken(token, table);
    if (!id) return back("invalid");
    if (isClaim) {
      await updateAirtableRecord(
        id,
        { Status: "Email confirmed", "Verify Token": "" },
        "Claims"
      );
    } else {
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
