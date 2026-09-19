import { NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/auth";
import { ownedSlugsForEmail } from "@/lib/owner";
import { getLead, markLeadRead } from "@/lib/leads";

export const dynamic = "force-dynamic";

// Owner marks one of their leads as read.
export async function POST(req: Request) {
  const email = getSessionEmail();
  if (!email) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  let b: Record<string, unknown>;
  try {
    b = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const id = String(b.id || "").trim();
  if (!id) return NextResponse.json({ error: "Missing lead." }, { status: 400 });

  const lead = await getLead(id);
  if (!lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  const owned = await ownedSlugsForEmail(email);
  if (!owned.includes(lead.slug)) {
    return NextResponse.json({ error: "You don't have access to this lead." }, { status: 403 });
  }

  await markLeadRead(id);
  return NextResponse.json({ ok: true });
}
