import { NextResponse } from "next/server";
import { emailConfigured } from "@/lib/email";
import {
  buildClaimPlan,
  sendClaimBatch,
  CLAIM_OUTREACH_DEFAULT_LIMIT,
} from "@/lib/claim-outreach";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// "Claim your listing" outreach to companies already in the directory that have
// a contact email. Shares its logic with the weekly cron (see
// /api/cron/claim-outreach and lib/claim-outreach).
//   GET  [?limit=50]          -> dry run: the exact recipient plan.
//   POST ?send=1[&limit=50]   -> actually sends. Auth: x-admin-key.

function authed(req: Request): boolean {
  const key = (req.headers.get("x-admin-key") || "").trim();
  const configured = (process.env.ADMIN_KEY || "").trim();
  return Boolean(configured) && key === configured;
}

function parseLimit(req: Request): number {
  return Math.min(
    200,
    Math.max(
      1,
      parseInt(new URL(req.url).searchParams.get("limit") || "", 10) ||
        CLAIM_OUTREACH_DEFAULT_LIMIT
    )
  );
}

export async function GET(req: Request) {
  if (!authed(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limit = parseLimit(req);
  const { recipients, totals } = await buildClaimPlan(limit);
  return NextResponse.json({
    ok: true,
    mode: "dry-run",
    emailConfigured: emailConfigured(),
    limit,
    totals,
    recipients,
  });
}

export async function POST(req: Request) {
  if (!authed(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  if (url.searchParams.get("send") !== "1") {
    return NextResponse.json(
      { error: "Pass ?send=1 to actually send. Use GET for a dry run." },
      { status: 400 }
    );
  }
  if (!emailConfigured()) {
    return NextResponse.json({ error: "RESEND_API_KEY not set" }, { status: 500 });
  }
  const limit = parseLimit(req);
  const result = await sendClaimBatch(limit);
  return NextResponse.json({ ok: true, mode: "send", ...result });
}
