"use client";

import { useState } from "react";

export type ORev = {
  id: string;
  name: string;
  company: string;
  rating: number;
  title: string;
  body: string;
  status: string;
  created: string;
  response?: string;
};

export function OwnerReviews({ slug, reviews }: { slug: string; reviews: ORev[] }) {
  const [emails, setEmails] = useState("");
  const [invBusy, setInvBusy] = useState(false);
  const [invMsg, setInvMsg] = useState("");
  const [list, setList] = useState(reviews);

  async function sendInvites() {
    setInvBusy(true);
    setInvMsg("");
    try {
      const res = await fetch("/api/owner/request-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, emails }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.ok) throw new Error(d.error || "Couldn't send invites.");
      setInvMsg(`✓ Sent ${d.sent} invite${d.sent !== 1 ? "s" : ""}${d.skipped ? `, ${d.skipped} skipped` : ""}.`);
      setEmails("");
    } catch (e) {
      setInvMsg(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setInvBusy(false);
    }
  }

  return (
    <div className="orev">
      <div className="orev-invite">
        <label htmlFor={`inv-${slug}`} className="stat-label">Request reviews from clients</label>
        <textarea
          id={`inv-${slug}`}
          rows={2}
          placeholder="Client emails — comma or line separated"
          value={emails}
          onChange={(e) => setEmails(e.target.value)}
          disabled={invBusy}
        />
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button type="button" className="btn btn--primary btn--sm" onClick={sendInvites} disabled={invBusy || !emails.trim()}>
            {invBusy ? "Sending…" : "Send invites"}
          </button>
          {invMsg && <span className="orev-msg">{invMsg}</span>}
        </div>
      </div>

      {list.length > 0 && (
        <ul className="orev-list">
          {list.map((r) => (
            <OwnerReviewRow
              key={r.id}
              r={r}
              onRespond={(resp) => setList((prev) => prev.map((x) => (x.id === r.id ? { ...x, response: resp } : x)))}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function OwnerReviewRow({ r, onRespond }: { r: ORev; onRespond: (s: string) => void }) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState(r.response || "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/owner/respond-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: r.id, response: val }),
      });
      if (res.ok) {
        onRespond(val);
        setOpen(false);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="orev-item">
      <div className="orev-item-top">
        <span className="rev-stars">
          {"★★★★★".slice(0, r.rating)}
          <span className="rev-stars-off">{"★★★★★".slice(r.rating)}</span>
        </span>
        <span className={`orev-status orev-status--${r.status}`}>{r.status}</span>
      </div>
      {r.title && <strong style={{ display: "block", marginTop: 6 }}>{r.title}</strong>}
      <p className="rev-body" style={{ margin: "6px 0" }}>{r.body}</p>
      <div className="rev-by">— {r.name}{r.company ? `, ${r.company}` : ""}</div>

      {r.response && !open && (
        <div className="rev-response" style={{ marginTop: 8 }}>
          <span className="rev-response-h">Your reply</span>
          <p>{r.response}</p>
        </div>
      )}

      {open ? (
        <div className="orev-reply">
          <textarea rows={2} value={val} onChange={(e) => setVal(e.target.value)} placeholder="Write a public reply…" disabled={busy} />
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn btn--primary btn--sm" onClick={save} disabled={busy}>{busy ? "Saving…" : "Post reply"}</button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
          </div>
        </div>
      ) : (
        <button type="button" className="btn btn--ghost btn--sm" style={{ marginTop: 8 }} onClick={() => setOpen(true)}>
          {r.response ? "Edit reply" : "Reply"}
        </button>
      )}
    </li>
  );
}
