import { NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Lightweight session probe so the (static) header nav can reflect sign-in state
// on the client without making every page dynamic.
export async function GET() {
  const email = getSessionEmail();
  return NextResponse.json(
    { signedIn: Boolean(email) },
    { headers: { "Cache-Control": "no-store" } }
  );
}
