import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSessionEmail, isAdmin } from "@/lib/auth";
import { publishVendor } from "@/lib/airtable";

export const dynamic = "force-dynamic";

// Approve a pending vendor submission (sets Status="Published"). Session-admin
// gated — it's the button on /admin.
export async function POST(req: Request) {
  const origin = new URL(req.url).origin;
  if (!isAdmin(getSessionEmail())) {
    return NextResponse.redirect(new URL("/login", origin), { status: 303 });
  }
  let id = "";
  let slug = "";
  try {
    const form = await req.formData();
    id = String(form.get("id") || "").trim();
    slug = String(form.get("slug") || "").trim();
  } catch {
    /* no-op */
  }
  if (id) {
    try {
      await publishVendor(id);
      if (slug) revalidatePath(`/directory/${slug}`);
    } catch (e) {
      console.error("[admin] publish vendor failed:", e);
    }
  }
  return NextResponse.redirect(new URL("/admin", origin), { status: 303 });
}
