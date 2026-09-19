import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getSessionEmail } from "@/lib/auth";
import { ownedSlugsForEmail } from "@/lib/owner";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
const MAX_BYTES = 8 * 1024 * 1024;

// Server-side owner image upload. The browser shrinks the image and POSTs it
// here (same-origin, no CSP/token/webhook dance); we authorize the owner and
// store it in Vercel Blob. Returns { url }.
export async function POST(req: Request) {
  const email = getSessionEmail();
  if (!email) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  const file = form.get("file");
  const slug = String(form.get("slug") || "").trim();
  if (!(file instanceof File) || !slug) {
    return NextResponse.json({ error: "Missing file." }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Unsupported image type." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image is too large (8 MB max)." }, { status: 413 });
  }

  const owned = await ownedSlugsForEmail(email);
  if (!owned.includes(slug)) {
    return NextResponse.json({ error: "You don't have access to this listing." }, { status: 403 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Image uploads aren't enabled yet." }, { status: 503 });
  }

  const safeName = (file.name || "image").replace(/[^a-z0-9._-]/gi, "_").slice(-60);
  try {
    const blob = await put(`${slug}/${safeName}`, file, {
      access: "public",
      token,
      addRandomSuffix: true,
    });
    return NextResponse.json({ url: blob.url });
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message || "Upload failed.").slice(0, 200) }, { status: 500 });
  }
}
