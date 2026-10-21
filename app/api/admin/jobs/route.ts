import { NextResponse } from "next/server";
import {
  listAllJobs,
  setJobStatus,
  deleteJob,
  createJob,
  JOB_TYPES,
  JobType,
} from "@/lib/jobs";

export const dynamic = "force-dynamic";

function authed(req: Request): boolean {
  const key = (req.headers.get("x-admin-key") || "").trim();
  const configured = (process.env.ADMIN_KEY || "").trim();
  return Boolean(configured) && key === configured;
}

// Admin-only: list every job (including pending) for moderation.
export async function GET(req: Request) {
  if (!authed(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const jobs = await listAllJobs();
  return NextResponse.json({ ok: true, count: jobs.length, jobs });
}

// Admin-only: approve/reject/delete a pending job, or post one directly (approved).
// Body: { id, action: "approve"|"reject"|"delete" }  OR  { create: {...job}, approved? }
export async function POST(req: Request) {
  if (!authed(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
  }

  // Direct admin post (auto-approved).
  if (body.create && typeof body.create === "object") {
    const c = body.create as Record<string, unknown>;
    const typeRaw = String(c.type ?? "Full-time");
    const job = await createJob({
      title: String(c.title ?? "").trim(),
      company: String(c.company ?? "").trim(),
      companyWebsite: c.companyWebsite ? String(c.companyWebsite).trim() : undefined,
      location: String(c.location ?? "Remote").trim(),
      remote: Boolean(c.remote),
      type: ((JOB_TYPES as string[]).includes(typeRaw) ? typeRaw : "Full-time") as JobType,
      applyUrl: c.applyUrl ? String(c.applyUrl).trim() : undefined,
      applyEmail: c.applyEmail ? String(c.applyEmail).trim() : undefined,
      description: String(c.description ?? "").trim(),
      source: "admin",
      status: body.approved === false ? "pending" : "approved",
    });
    return NextResponse.json({ ok: true, id: job.id });
  }

  const id = String(body.id ?? "").trim();
  const action = String(body.action ?? "").trim();
  if (!id || !action) {
    return NextResponse.json({ ok: false, error: "id and action required" }, { status: 400 });
  }

  if (action === "delete") {
    const ok = await deleteJob(id);
    return NextResponse.json({ ok, id, action });
  }
  const status = action === "approve" ? "approved" : action === "reject" ? "rejected" : null;
  if (!status) {
    return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });
  }
  const ok = await setJobStatus(id, status);
  return NextResponse.json({ ok, id, status });
}
