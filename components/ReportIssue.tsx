"use client";

import { useEffect, useState } from "react";

type Status = "idle" | "submitting" | "done" | "error";

export function ReportIssue({
  vendorName,
  vendorSlug,
}: {
  vendorName: string;
  vendorSlug: string;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      vendor: vendorName,
      vendorSlug,
      issueType: fd.get("issueType"),
      details: fd.get("details"),
      email: fd.get("email"),
      company_url: fd.get("company_url"), // honeypot
    };
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to send report.");
      }
      setStatus("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  function openModal() {
    setStatus("idle");
    setErrorMsg("");
    setOpen(true);
  }

  return (
    <>
      <button className="report-trigger" type="button" onClick={openModal}>
        Report an issue
      </button>

      {open && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="modal-card" role="dialog" aria-modal="true" aria-label="Report an issue">
            {status === "done" ? (
              <>
                <h3>Thanks for the heads-up.</h3>
                <p className="modal-sub">
                  We&rsquo;ll review your report on {vendorName} and update the
                  listing if needed.
                </p>
                <button className="btn btn--primary" type="button" onClick={() => setOpen(false)}>
                  Close
                </button>
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                <h3>Report an issue</h3>
                <p className="modal-sub">
                  Something wrong with <strong>{vendorName}</strong>? Let us know.
                </p>

                <input
                  type="text"
                  name="company_url"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }}
                />

                <div className="field">
                  <label htmlFor="issueType">What&rsquo;s the issue?</label>
                  <select id="issueType" name="issueType" defaultValue="Incorrect information">
                    <option>Incorrect information</option>
                    <option>Company has closed</option>
                    <option>Wrong category</option>
                    <option>Duplicate listing</option>
                    <option>Spam or inappropriate</option>
                    <option>Other</option>
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="details">Details *</label>
                  <textarea
                    id="details"
                    name="details"
                    required
                    placeholder="Tell us what's wrong so we can fix it."
                  />
                </div>

                <div className="field">
                  <label htmlFor="reporterEmail">Your email (optional)</label>
                  <input
                    id="reporterEmail"
                    name="email"
                    type="email"
                    placeholder="So we can follow up"
                  />
                </div>

                {status === "error" && (
                  <div className="report-error" role="alert">
                    {errorMsg}
                  </div>
                )}

                <div className="modal-actions">
                  <button
                    className="btn btn--primary"
                    type="submit"
                    disabled={status === "submitting"}
                  >
                    {status === "submitting" ? "Sending…" : "Submit report"}
                  </button>
                  <button className="btn btn--ghost" type="button" onClick={() => setOpen(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
