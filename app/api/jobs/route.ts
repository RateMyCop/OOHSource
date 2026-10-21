import { NextResponse } from "next/server";
import { createJob, JOB_TYPES, JobType } from "@/lib/jobs";

export const dynamic = "force-dynamic";

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

// Public job submission. Lands as "pending" for admin approval.
// Body: { title, company, companyWebsite?, location, remote?, type, applyUrl?, applyEmail?, description, company_url? (honeypot) }
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot — bots fill the hidden field.
  if (typeof body.company_url === "string" && body.company_url.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const title = String(body.title ?? "").trim().slice(0, 140);
  const company = String(body.company ?? "").trim().slice(0, 120);
  const location = String(body.location ?? "").trim().slice(0, 120) || "Remote";
  const description = String(body.description ?? "").trim().slice(0, 6000);
  const companyWebsite = String(body.companyWebsite ?? "").trim().slice(0, 300);
  const applyUrl = String(body.applyUrl ?? "").trim().slice(0, 400);
  const applyEmail = String(body.applyEmail ?? "").trim().slice(0, 160);
  const remote = Boolean(body.remote);
  const typeRaw = String(body.type ?? "Full-time").trim();
  const type: JobType = (JOB_TYPES as string[]).includes(typeRaw)
    ? (typeRaw as JobType)
    : "Full-time";

  if (!title || !company || !description) {
    return NextResponse.json(
      { error: "Title, company, and description are required." },
      { status: 400 }
    );
  }
  if (!applyUrl && !applyEmail) {
    return NextResponse.json(
      { error: "Add an apply link or an apply email." },
      { status: 400 }
    );
  }
  if (applyEmail && !isEmail(applyEmail)) {
    return NextResponse.json({ error: "Apply email is invalid." }, { status: 400 });
  }

  try {
    const job = await createJob({
      title,
      company,
      companyWebsite: companyWebsite || undefined,
      location,
      remote,
      type,
      applyUrl: applyUrl || undefined,
      applyEmail: applyEmail || undefined,
      description,
      source: "submission",
    });
    return NextResponse.json({ ok: true, id: job.id });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
