"use client";

import { useState } from "react";
import Link from "next/link";

const TYPES = ["Full-time", "Part-time", "Contract", "Freelance", "Internship"];

export function JobPostForm() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const f = new FormData(e.currentTarget);
    const payload = {
      title: f.get("title"),
      company: f.get("company"),
      companyWebsite: f.get("companyWebsite"),
      location: f.get("location"),
      remote: f.get("remote") === "on",
      type: f.get("type"),
      applyUrl: f.get("applyUrl"),
      applyEmail: f.get("applyEmail"),
      description: f.get("description"),
      company_url: f.get("company_url"), // honeypot
    };
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setDone(true);
        return;
      }
      setErr(data.error || "Something went wrong. Please try again.");
    } catch {
      setErr("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="aside-card" style={{ maxWidth: 560 }}>
        <h3 style={{ marginTop: 0 }}>Thanks — your job was submitted.</h3>
        <p className="hint" style={{ margin: 0 }}>
          We review posts before they go live (usually within a day). You&rsquo;ll
          see it on the <Link href="/jobs">jobs board</Link> once it&rsquo;s approved.
        </p>
      </div>
    );
  }

  return (
    <form className="job-form" onSubmit={onSubmit}>
      <label>
        Job title *
        <input name="title" required maxLength={140} placeholder="e.g. Senior Account Executive" />
      </label>
      <div className="job-form-row">
        <label>
          Company *
          <input name="company" required maxLength={120} placeholder="Company name" />
        </label>
        <label>
          Company website
          <input name="companyWebsite" type="url" placeholder="https://…" />
        </label>
      </div>
      <div className="job-form-row">
        <label>
          Location
          <input name="location" maxLength={120} placeholder="City, Country (or Remote)" />
        </label>
        <label>
          Type
          <select name="type" defaultValue="Full-time">
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="job-form-check">
        <input name="remote" type="checkbox" /> Remote-friendly
      </label>
      <div className="job-form-row">
        <label>
          Apply link
          <input name="applyUrl" type="url" placeholder="https://… (careers page)" />
        </label>
        <label>
          …or apply email
          <input name="applyEmail" type="email" placeholder="jobs@company.com" />
        </label>
      </div>
      <label>
        Description *
        <textarea
          name="description"
          required
          rows={10}
          maxLength={6000}
          placeholder="Role, responsibilities, requirements, how to apply…"
        />
      </label>
      {/* honeypot */}
      <input
        name="company_url"
        tabIndex={-1}
        autoComplete="off"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }}
        aria-hidden="true"
      />
      {err && <p className="feature-err">{err}</p>}
      <div>
        <button className="btn btn--primary" type="submit" disabled={busy}>
          {busy ? "Submitting…" : "Submit job"}
        </button>
      </div>
      <p className="hint" style={{ marginTop: 4 }}>
        Posting is free while we build out the board. We review submissions before
        they go live.
      </p>
    </form>
  );
}
