import { NextResponse } from "next/server";
import { getSessionEmail, isAdmin } from "@/lib/auth";
import { approveClaim } from "@/lib/airtable";

export const dynamic = "force-dynamic";

// Approve a claim (sets Status="Approved" so the owner is authorized even
// without a domain match). Gated to a signed-in admin — it's the button on
// /admin, so it uses the session, not the admin key.
export async function POST(req: Request) {
  const origin = new URL(req.url).origin;
  if (!isAdmin(getSessionEmail())) {
    return NextResponse.redirect(new URL("/login", origin), { status: 303 });
  }
  let id = "";
  try {
    const form = await req.formData();
    id = String(form.get("id") || "").trim();
  } catch {
    /* no-op */
  }
  if (id) {
    try {
      await approveClaim(id);
    } catch (e) {
      console.error("[admin] approve claim failed:", e);
    }
  }
  return NextResponse.redirect(new URL("/admin", origin), { status: 303 });
}
