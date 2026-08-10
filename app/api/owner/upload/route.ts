import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getSessionEmail } from "@/lib/auth";
import { ownedSlugsForEmail } from "@/lib/owner";

export const dynamic = "force-dynamic";

// Client-upload token endpoint for owner image uploads. The browser uploads
// directly to Vercel Blob; this route only authorizes and mints a scoped token,
// so it stays fast and never streams the file through our function.
export async function POST(req: Request) {
  let body: HandleUploadBody;
  try {
    body = (await req.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const json = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        // Only a signed-in owner of the target listing may upload.
        const email = getSessionEmail();
        if (!email) throw new Error("Please sign in again.");
        let slug = "";
        try {
          slug = String(JSON.parse(clientPayload || "{}").slug || "");
        } catch {
          /* leave slug empty -> rejected below */
        }
        const owned = await ownedSlugsForEmail(email);
        if (!slug || !owned.includes(slug)) {
          throw new Error("You don't have access to this listing.");
        }
        return {
          access: "public",
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "image/avif",
          ],
          maximumSizeInBytes: 8 * 1024 * 1024, // 8 MB
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ slug }),
        };
      },
      onUploadCompleted: async () => {
        // Nothing to do — the client appends the returned URL and saves via
        // /api/owner/update. (This callback isn't reachable on localhost.)
      },
    });
    return NextResponse.json(json);
  } catch (e) {
    // Auth failures (owner check) surface their message; anything mentioning a
    // token/store means Blob isn't wired up yet — nudge toward the URL fallback.
    const msg = (e as Error).message || "Upload failed.";
    const notConfigured = /token|blob_read_write|no store|store not found/i.test(msg);
    return NextResponse.json(
      {
        error: notConfigured
          ? "Image uploads aren't enabled yet. You can still add images by URL."
          : msg,
      },
      { status: notConfigured ? 503 : 400 }
    );
  }
}
