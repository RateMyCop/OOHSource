"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "done" | "error";

const TOPICS = [
  "General enquiry",
  "Claim or correct a listing",
  "Featured & advertising",
  "Press & media",
  "Partnerships",
];

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get("name"),
      email: fd.get("email"),
      company: fd.get("company"),
      topic: fd.get("topic"),
      message: fd.get("message"),
      company_url: fd.get("company_url"), // honeypot
    };
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.ok) throw new Error(d.error || "Couldn't send your message.");
      setStatus("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="form-ok show" role="status" style={{ margin: 0 }}>
        ✓ Thanks — your message is on its way. We usually reply within one
        business day.
      </div>
    );
  }

  const submitting = status === "submitting";

  return (
    <form onSubmit={handleSubmit} className="form-wrap">
      <div className="field">
        <label htmlFor="c-name">Your name</label>
        <input id="c-name" name="name" type="text" required disabled={submitting} autoComplete="name" />
      </div>
      <div className="field">
        <label htmlFor="c-email">Email</label>
        <input id="c-email" name="email" type="email" required disabled={submitting} autoComplete="email" placeholder="you@company.com" />
      </div>
      <div className="field">
        <label htmlFor="c-company">Company <span className="opt">— optional</span></label>
        <input id="c-company" name="company" type="text" disabled={submitting} autoComplete="organization" />
      </div>
      <div className="field">
        <label htmlFor="c-topic">What&rsquo;s this about?</label>
        <select id="c-topic" name="topic" defaultValue={TOPICS[0]} disabled={submitting}>
          {TOPICS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="c-message">Message</label>
        <textarea id="c-message" name="message" rows={6} required disabled={submitting} />
      </div>

      {/* Honeypot: hidden from humans, catches bots. */}
      <input
        type="text"
        name="company_url"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
      />

      {status === "error" && (
        <div className="report-error" role="alert" style={{ margin: "4px 0 14px" }}>
          {errorMsg}
        </div>
      )}

      <button className="btn btn--primary" type="submit" disabled={submitting}>
        {submitting ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
