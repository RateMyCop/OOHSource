"use client";

import { useState } from "react";

export type OLead = {
  id: string;
  name: string;
  email: string;
  company?: string;
  message: string;
  created: string;
  read: boolean;
};

export function OwnerLeads({ leads }: { leads: OLead[] }) {
  const [list, setList] = useState(leads);

  async function markRead(id: string) {
    setList((prev) => prev.map((l) => (l.id === id ? { ...l, read: true } : l)));
    try {
      await fetch("/api/owner/lead-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      /* best-effort */
    }
  }

  if (!list.length) {
    return (
      <p className="hint">
        No inquiries yet. Buyers who click &ldquo;Contact this company&rdquo; on your public profile will show up here.
      </p>
    );
  }

  return (
    <ul className="orev-list">
      {list.map((l) => (
        <li key={l.id} className="orev-item">
          <div className="orev-item-top">
            <strong>
              {l.name}
              {l.company ? `, ${l.company}` : ""}
            </strong>
            {!l.read && <span className="orev-status orev-status--pending">New</span>}
          </div>
          <p className="rev-body" style={{ margin: "6px 0" }}>{l.message}</p>
          <div className="rev-by">
            {new Date(l.created).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} ·{" "}
            <a href={`mailto:${l.email}`}>{l.email}</a>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <a className="btn btn--primary btn--sm" href={`mailto:${l.email}?subject=Re: your OOHsource inquiry`}>Reply</a>
            {!l.read && (
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => markRead(l.id)}>Mark read</button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
