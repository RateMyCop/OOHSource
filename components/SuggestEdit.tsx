"use client";

import { useState } from "react";

// Lets anyone suggest a correction to, or a new addition for, the Industry
// Media directory. Posts to /api/suggest, which emails hello@oohsource.com.
export function SuggestEdit({ context }: { context?: string }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "sending" | "done" | "error"
  >("idle");
  const [subject, setSubject] = useState(context ?? "");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [hp, setHp] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim().length < 4) return;
    setStatus("sending");
    try {
      const r = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message, email, company_url: hp }),
      }).then((res) => res.json());
      setStatus(r.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="suggest">
        <p className="suggest-done">
          ✓ Thanks — your suggestion is on its way to our editors.
        </p>
      </div>
    );
  }

  return (
    <div className="suggest">
      {!open ? (
        <button
          type="button"
          className="suggest-toggle"
          onClick={() => setOpen(true)}
        >
          {context
            ? "Suggest an edit to this listing"
            : "Suggest an edit or a publication to add"}
        </button>
      ) : (
        <form className="suggest-form" onSubmit={submit}>
          <label className="suggest-field">
            <span>What&rsquo;s this about?</span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Publication name or URL"
            />
          </label>
          <label className="suggest-field">
            <span>Your suggestion</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What should we add, fix, or update?"
              rows={4}
              required
            />
          </label>
          <label className="suggest-field">
            <span>Your email (optional)</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="So we can follow up"
            />
          </label>
          {/* honeypot */}
          <input
            type="text"
            value={hp}
            onChange={(e) => setHp(e.target.value)}
            name="company_url"
            tabIndex={-1}
            autoComplete="off"
            style={{ position: "absolute", left: "-9999px" }}
            aria-hidden="true"
          />
          <div className="suggest-actions">
            <button
              type="submit"
              className="load-more"
              disabled={status === "sending"}
            >
              {status === "sending" ? "Sending…" : "Send suggestion"}
            </button>
            <button
              type="button"
              className="suggest-cancel"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
          </div>
          {status === "error" && (
            <p className="suggest-err">
              Something went wrong — please try again.
            </p>
          )}
        </form>
      )}
    </div>
  );
}
