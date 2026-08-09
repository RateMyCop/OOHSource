"use client";

import { useEffect, useState } from "react";

type Status = "idle" | "submitting" | "done" | "error";

export function ClaimListing({
  vendorName,
  vendorSlug,
}: {
  vendorName: string;
  vendorSlug: string;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [verifyPending, setVerifyPending] = useState(false);

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
      vendorSlug,
      email: fd.get("email"),
      note: fd.get("note"),
      company_url: fd.get("company_url"), // honeypot
    };
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Couldn't send your claim.");
      }
      const data = await res.json().catch(() => ({}));
      setVerifyPending(Boolean(data.verify));
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
      <button className="btn btn--ghost" type="button" onClick={openModal} style={{ width: "100%", justifyContent: "center" }}>
        Claim this listing
      </button>

      {open && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="modal-card" role="dialog" aria-modal="true" aria-label="Claim this listing">
            {status === "done" ? (
              <>
                <h3>Claim submitted.</h3>
                <p className="modal-sub">
                  {verifyPending
                    ? `Check your email — click the link to confirm your claim on ${vendorName}. We'll review it and get you access.`
                    : `Thanks — your claim on ${vendorName} is in for review. We'll be in touch.`}
                </p>
                <button className="btn btn--primary" type="button" onClick={() => setOpen(false)}>
                  Close
                </button>
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                <h3>Claim this listing</h3>
                <p className="modal-sub">
                  Work at <strong>{vendorName}</strong>? Claim the listing to manage
                  it. Use your <strong>company email</strong> — it verifies ownership
                  and gets you approved faster.
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
                  <label htmlFor="claimEmail">Work email *</label>
                  <input
                    id="claimEmail"
                    name="email"
                    type="email"
                    required
                    placeholder={`you@${vendorName.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`}
                  />
                  <span className="hint">
                    Best if it matches the company&rsquo;s website domain.
                  </span>
                </div>

                <div className="field">
                  <label htmlFor="claimNote">Anything to add? (optional)</label>
                  <textarea id="claimNote" name="note" placeholder="Your role, or details to help us verify." />
                </div>

                {status === "error" && (
                  <div className="report-error" role="alert">
                    {errorMsg}
                  </div>
                )}

                <div className="modal-actions">
                  <button className="btn btn--primary" type="submit" disabled={status === "submitting"}>
                    {status === "submitting" ? "Sending…" : "Submit claim"}
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
