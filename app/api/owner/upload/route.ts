import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getSessionEmail } from "@/lib/auth";
import { ownedSlugsForEmail } from "@/lib/owner";

export const dynamic = "force-dynamic";

// Client-upload token endpoint for owner image uploads. The browser uploads
// directly to Vercel Blob; this route only authorizes and mints a scoped token,
// so it stays fast and never streams the file through our function.
export async function POST(req: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Image uploads aren't enabled yet. You can still add images by URL." },
      { status: 503 }
    );
  }

  const body = (await req.json()) as HandleUploadBody;
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
    return NextResponse.json(
      { error: (e as Error).message || "Upload failed." },
      { status: 400 }
    );
  }
}
