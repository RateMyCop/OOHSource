"use client";

import { useState } from "react";

// Public "Contact this company" inquiry form on a profile. Posts to /api/lead.
export function ContactCompany({ slug, name }: { slug: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setStatus("sending");
    setErr("");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          name: fd.get("name"),
          email: fd.get("email"),
          company: fd.get("company"),
          message: fd.get("message"),
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.ok) throw new Error(d.error || "Couldn't send your message.");
      setStatus("done");
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Something went wrong.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return <div className="rev-thanks" role="status">✓ Message sent — {name} will get back to you.</div>;
  }

  if (!open) {
    return (
      <button type="button" className="btn btn--ghost" style={{ width: "100%", justifyContent: "center" }} onClick={() => setOpen(true)}>
        Contact this company
      </button>
    );
  }

  const sending = status === "sending";
  return (
    <form className="rev-form" onSubmit={submit} style={{ marginTop: 0 }}>
      <input name="name" placeholder="Your name" required disabled={sending} />
      <input name="email" type="email" placeholder="Your email" required disabled={sending} />
      <input name="company" placeholder="Your company (optional)" disabled={sending} />
      <textarea name="message" rows={4} placeholder={`How can ${name} help?`} required disabled={sending} />
      {status === "error" && <p className="rev-err">{err}</p>}
      <div className="rev-actions">
        <button type="submit" className="btn btn--primary btn--sm" disabled={sending}>{sending ? "Sending…" : "Send message"}</button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setOpen(false)} disabled={sending}>Cancel</button>
      </div>
    </form>
  );
}
