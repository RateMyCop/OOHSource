export const runtime = "edge";
export const dynamic = "force-dynamic";

// Tiny geo echo. Reads Vercel's edge geolocation header (approximate city from
// IP — no permission prompt, no cookie) and returns it as JSON. This is what
// lets the homepage stay statically generated / edge-cached: instead of the
// page reading the header server-side (which forces a dynamic render on every
// request), the client fetches this endpoint on mount to personalize the hero.
export async function GET(req: Request) {
  const raw = req.headers.get("x-vercel-ip-city") || "";
  const city = raw ? decodeURIComponent(raw.replace(/\+/g, " ")) : "";
  return new Response(JSON.stringify({ city }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
