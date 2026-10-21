import type { Metadata } from "next";
import Link from "next/link";
import { listApprovedJobs } from "@/lib/jobs";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL } from "@/lib/lists";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "OOH Jobs — Out-of-Home Advertising Careers",
  description:
    "Jobs in out-of-home advertising — media owners, DOOH, transit, agencies, adtech and more. Browse open roles or post a job to reach the OOH industry.",
  alternates: { canonical: `${SITE_URL}/jobs` },
};

function timeAgo(iso: string): string {
  const d = Date.now() - new Date(iso).getTime();
  const days = Math.floor(d / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default async function JobsPage() {
  const jobs = await listApprovedJobs();

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "OOH advertising jobs",
    numberOfItems: jobs.length,
    itemListElement: jobs.slice(0, 25).map((j, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/jobs/${j.id}`,
      name: `${j.title} — ${j.company}`,
    })),
  };

  return (
    <section className="wrap" style={{ paddingBottom: 80 }}>
      <JsonLd data={itemList} />
      <div className="page-head">
        <div className="crumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span>Jobs</span>
        </div>
        <h1>Out-of-home jobs.</h1>
        <p className="lede" style={{ maxWidth: "60ch" }}>
          Open roles across the out-of-home industry — media owners, DOOH,
          transit, agencies, adtech, production and creative. Hiring?{" "}
          <Link href="/jobs/post" style={{ color: "var(--accent-strong)" }}>
            Post a job →
          </Link>
        </p>
        <div style={{ marginTop: 18 }}>
          <Link href="/jobs/post" className="btn btn--primary">
            Post a job
          </Link>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="empty" style={{ marginTop: 10 }}>
          No open roles are posted right now.{" "}
          <Link href="/jobs/post" style={{ color: "var(--accent-strong)" }}>
            Be the first to post one.
          </Link>
        </div>
      ) : (
        <ul className="job-list">
          {jobs.map((j) => (
            <li key={j.id}>
              <Link href={`/jobs/${j.id}`} className="job-row">
                <div className="job-main">
                  <h2 className="job-title">{j.title}</h2>
                  <div className="job-meta">
                    <span className="job-co">{j.company}</span>
                    <span className="job-dot">·</span>
                    <span>{j.location}</span>
                    {j.remote && <span className="job-tag job-tag--remote">Remote</span>}
                    <span className="job-tag">{j.type}</span>
                  </div>
                </div>
                <div className="job-aside">
                  <span className="job-age">{timeAgo(j.postedAt)}</span>
                  <span className="job-view">View →</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
