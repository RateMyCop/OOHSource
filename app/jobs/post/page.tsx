import type { Metadata } from "next";
import Link from "next/link";
import { JobPostForm } from "@/components/JobPostForm";
import { SITE_URL } from "@/lib/lists";

export const metadata: Metadata = {
  title: "Post an OOH Job — OOHsource",
  description:
    "Post a job to the out-of-home advertising industry. Reach media owners, agencies, DOOH and adtech professionals on OOHsource.",
  alternates: { canonical: `${SITE_URL}/jobs/post` },
};

export default function PostJobPage() {
  return (
    <section className="wrap page-head" style={{ paddingBottom: 80, maxWidth: 760 }}>
      <div className="crumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/jobs">Jobs</Link>
        <span>/</span>
        <span>Post a job</span>
      </div>
      <h1>Post a job.</h1>
      <p className="lede" style={{ maxWidth: "58ch", marginBottom: 28 }}>
        Reach the out-of-home industry — media owners, agencies, DOOH and adtech
        teams browse OOHsource. Fill this in and we&rsquo;ll review it before it
        goes live.
      </p>
      <JobPostForm />
    </section>
  );
}
