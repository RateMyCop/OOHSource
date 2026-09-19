import { NextResponse } from "next/server";
import { getSessionEmail, isAdmin } from "@/lib/auth";
import { listPendingReviews, setReviewStatus } from "@/lib/reviews";

export const dynamic = "force-dynamic";

function keyOk(req: Request): boolean {
  const key = (req.headers.get("x-admin-key") || "").trim();
  const cfg = (process.env.ADMIN_KEY || "").trim();
  return Boolean(cfg) && key === cfg;
}

// GET (admin key): the pending-review moderation queue.
export async function GET(req: Request) {
  if (!keyOk(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ ok: true, pending: await listPendingReviews() });
}

// POST: publish or reject a review. Works as an admin-key JSON call OR as a
// signed-in admin form submit (the buttons on /admin).
export async function POST(req: Request) {
  const origin = new URL(req.url).origin;
  const viaKey = keyOk(req);
  const viaSession = isAdmin(getSessionEmail());
  if (!viaKey && !viaSession) {
    return NextResponse.redirect(new URL("/login", origin), { status: 303 });
  }

  let id = "";
  let action = "";
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    id = String(b.id || "").trim();
    action = String(b.action || "").trim();
  } else {
    const f = await req.formData().catch(() => null);
    id = String(f?.get("id") || "").trim();
    action = String(f?.get("action") || "").trim();
  }

  if (id && (action === "publish" || action === "reject")) {
    await setReviewStatus(id, action === "publish" ? "published" : "rejected");
  }

  if (viaKey) return NextResponse.json({ ok: true });
  return NextResponse.redirect(new URL("/admin#reviews", origin), { status: 303 });
}
