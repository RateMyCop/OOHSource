import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getJob } from "@/lib/jobs";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL } from "@/lib/lists";

export const revalidate = 60;

const EMPLOYMENT: Record<string, string> = {
  "Full-time": "FULL_TIME",
  "Part-time": "PART_TIME",
  Contract: "CONTRACTOR",
  Freelance: "CONTRACTOR",
  Internship: "INTERN",
};

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const job = await getJob(params.id);
  if (!job || job.status !== "approved") return { title: "Job not found" };
  return {
    title: `${job.title} at ${job.company} — OOH Jobs`,
    description: `${job.title} — ${job.company} (${job.location}). ${job.description.slice(0, 140)}`,
    alternates: { canonical: `${SITE_URL}/jobs/${job.id}` },
  };
}

export default async function JobDetail({ params }: { params: { id: string } }) {
  const job = await getJob(params.id);
  if (!job || job.status !== "approved") notFound();

  const applyHref = job.applyUrl
    ? job.applyUrl
    : job.applyEmail
    ? `mailto:${job.applyEmail}?subject=${encodeURIComponent(`Application: ${job.title}`)}`
    : "";

  const posted = new Date(job.postedAt);
  const validThrough = new Date(posted.getTime() + 45 * 86400000);
  const [city, country] = job.location.split(",").map((s) => s.trim());

  const jobPosting = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: `<p>${job.description.replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br/>")}</p>`,
    datePosted: posted.toISOString().slice(0, 10),
    validThrough: validThrough.toISOString().slice(0, 10),
    employmentType: EMPLOYMENT[job.type] || "FULL_TIME",
    hiringOrganization: {
      "@type": "Organization",
      name: job.company,
      ...(job.companyWebsite ? { sameAs: job.companyWebsite } : {}),
    },
    ...(job.remote
      ? {
          jobLocationType: "TELECOMMUTE",
          applicantLocationRequirements: {
            "@type": "Country",
            name: country || "Worldwide",
          },
        }
      : {
          jobLocation: {
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              addressLocality: city || job.location,
              ...(country ? { addressCountry: country } : {}),
            },
          },
        }),
    directApply: Boolean(job.applyUrl),
    url: `${SITE_URL}/jobs/${job.id}`,
  };

  return (
    <section className="wrap page-head" style={{ paddingBottom: 80 }}>
      <JsonLd data={jobPosting} />
      <div className="crumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/jobs">Jobs</Link>
        <span>/</span>
        <span>{job.title}</span>
      </div>

      <h1 style={{ marginBottom: 8 }}>{job.title}</h1>
      <div className="job-meta" style={{ marginBottom: 20 }}>
        {job.companyWebsite ? (
          <a className="job-co" href={job.companyWebsite} target="_blank" rel="noopener noreferrer">
            {job.company}
          </a>
        ) : (
          <span className="job-co">{job.company}</span>
        )}
        <span className="job-dot">·</span>
        <span>{job.location}</span>
        {job.remote && <span className="job-tag job-tag--remote">Remote</span>}
        <span className="job-tag">{job.type}</span>
      </div>

      {applyHref && (
        <div style={{ marginBottom: 26 }}>
          <a
            className="btn btn--primary"
            href={applyHref}
            target={job.applyUrl ? "_blank" : undefined}
            rel={job.applyUrl ? "noopener noreferrer" : undefined}
          >
            Apply now →
          </a>
        </div>
      )}

      <div className="job-desc">
        {job.description.split(/\n{2,}/).map((p, i) => (
          <p key={i}>
            {p.split("\n").map((line, j) => (
              <span key={j}>
                {line}
                {j < p.split("\n").length - 1 && <br />}
              </span>
            ))}
          </p>
        ))}
      </div>

      {applyHref && (
        <div style={{ marginTop: 28 }}>
          <a
            className="btn btn--primary"
            href={applyHref}
            target={job.applyUrl ? "_blank" : undefined}
            rel={job.applyUrl ? "noopener noreferrer" : undefined}
          >
            Apply now →
          </a>
        </div>
      )}

      <p className="hint" style={{ marginTop: 34 }}>
        <Link href="/jobs">← All jobs</Link> &nbsp;·&nbsp;{" "}
        <Link href="/jobs/post">Post a job</Link>
      </p>
    </section>
  );
}
