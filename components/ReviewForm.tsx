"use client";

import { useState } from "react";

export function ReviewForm({
  slug,
  defaultOpen = false,
  source = "direct",
}: {
  slug: string;
  defaultOpen?: boolean;
  source?: "direct" | "invited";
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setStatus("sending");
    setErr("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          source,
          rating,
          name: fd.get("name"),
          company: fd.get("company"),
          email: fd.get("email"),
          title: fd.get("title"),
          body: fd.get("body"),
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.ok) throw new Error(d.error || "Couldn't submit your review.");
      setStatus("done");
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Something went wrong.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="rev-thanks" role="status">
        ✓ Thanks for your review! It&rsquo;ll appear once it&rsquo;s approved.
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" className="btn btn--ghost btn--sm rev-open" onClick={() => setOpen(true)}>
        ★ Write a review
      </button>
    );
  }

  const sending = status === "sending";
  return (
    <form className="rev-form" onSubmit={submit} id="write-review">
      <div className="rev-stars-pick" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={`rev-star${(hover || rating) >= n ? " on" : ""}`}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            aria-pressed={rating === n}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
          >
            ★
          </button>
        ))}
        <span className="rev-stars-label">{rating ? `${rating}/5` : "Tap to rate"}</span>
      </div>

      <div className="rev-row">
        <input name="name" placeholder="Your name" required disabled={sending} />
        <input name="company" placeholder="Your company (optional)" disabled={sending} />
      </div>
      <input name="email" type="email" placeholder="Your email (not shown publicly)" required disabled={sending} />
      <input name="title" placeholder="Headline (optional)" disabled={sending} />
      <textarea name="body" rows={5} placeholder="What was it like working with them?" required disabled={sending} />

      {status === "error" && <p className="rev-err">{err}</p>}

      <div className="rev-actions">
        <button type="submit" className="btn btn--primary btn--sm" disabled={sending || rating === 0}>
          {sending ? "Submitting…" : "Submit review"}
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setOpen(false)} disabled={sending}>
          Cancel
        </button>
      </div>
      <p className="hint">Reviews are moderated before they appear.</p>
    </form>
  );
}
