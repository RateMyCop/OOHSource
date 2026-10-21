import { kv, kvGetCached } from "@/lib/kv";

// Lightweight job board for the OOH industry. Jobs live in a single KV doc so
// public pages can read them with a build-safe CACHED fetch (never no-store),
// mirroring the boosts store. Submissions land as "pending" and an admin
// approves them before they show publicly.
//
//   oohs:jobs  ->  Job[]

const JOBS_KEY = "oohs:jobs";

export type JobType =
  | "Full-time"
  | "Part-time"
  | "Contract"
  | "Freelance"
  | "Internship";

export type JobStatus = "pending" | "approved" | "rejected";

export type Job = {
  id: string;
  title: string;
  company: string;
  companyWebsite?: string;
  location: string; // "City, Country" or "Remote"
  remote: boolean;
  type: JobType;
  applyUrl?: string; // external apply link
  applyEmail?: string; // or an email to apply to
  description: string; // plain text / light HTML
  postedAt: string; // ISO
  status: JobStatus;
  source?: string; // "submission" | "admin"
};

export const JOB_TYPES: JobType[] = [
  "Full-time",
  "Part-time",
  "Contract",
  "Freelance",
  "Internship",
];

function parse(raw: unknown): Job[] {
  let v: unknown = raw;
  for (let i = 0; i < 2 && typeof v === "string"; i++) {
    try {
      v = JSON.parse(v);
    } catch {
      return [];
    }
  }
  return Array.isArray(v) ? (v as Job[]) : [];
}

// Build-safe cached read (public pages).
export async function readJobsCached(revalidate = 60): Promise<Job[]> {
  const raw = await kvGetCached(JOBS_KEY, revalidate);
  return raw == null ? [] : parse(raw);
}

function byNewest(a: Job, b: Job) {
  return (b.postedAt || "").localeCompare(a.postedAt || "");
}

export async function listApprovedJobs(): Promise<Job[]> {
  const jobs = await readJobsCached();
  return jobs.filter((j) => j.status === "approved").sort(byNewest);
}

export async function getJob(id: string): Promise<Job | null> {
  const jobs = await readJobsCached();
  return jobs.find((j) => j.id === id) || null;
}

// --- Writes (API routes only; no-store client) ------------------------------

async function readLive(): Promise<Job[]> {
  const r = kv();
  if (!r) return [];
  return parse(await r.get(JOBS_KEY));
}

async function writeLive(jobs: Job[]): Promise<void> {
  const r = kv();
  if (!r) return;
  await r.set(JOBS_KEY, JSON.stringify(jobs));
}

export async function listAllJobs(): Promise<Job[]> {
  return (await readLive()).sort(byNewest);
}

function slugId(title: string, company: string): string {
  const base = `${company}-${title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function createJob(
  input: Omit<Job, "id" | "postedAt" | "status"> & { status?: JobStatus }
): Promise<Job> {
  const jobs = await readLive();
  const job: Job = {
    ...input,
    id: slugId(input.title, input.company),
    postedAt: new Date().toISOString(),
    status: input.status || "pending",
  };
  jobs.push(job);
  await writeLive(jobs);
  return job;
}

export async function setJobStatus(
  id: string,
  status: JobStatus
): Promise<boolean> {
  const jobs = await readLive();
  const j = jobs.find((x) => x.id === id);
  if (!j) return false;
  j.status = status;
  await writeLive(jobs);
  return true;
}

export async function deleteJob(id: string): Promise<boolean> {
  const jobs = await readLive();
  const next = jobs.filter((x) => x.id !== id);
  if (next.length === jobs.length) return false;
  await writeLive(next);
  return true;
}
