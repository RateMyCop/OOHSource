"use client";

import { useState } from "react";

type Status = "idle" | "sending" | "sent" | "error";

export function LoginForm({ initialError = false }: { initialError?: boolean }) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState(
    initialError ? "That sign-in link was invalid or already used. Enter your email for a fresh one." : ""
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") || "").trim();
    if (!email) return;
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      setStatus("sent");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="form-ok show" role="status">
        ✓ If that email is on a confirmed listing, we&rsquo;ve sent a sign-in
        link. Check your inbox — it works once and expires in 20 minutes.
      </div>
    );
  }

  const sending = status === "sending";

  return (
    <form onSubmit={handleSubmit} className="form-wrap" style={{ maxWidth: 440 }}>
      <div className="field">
        <label htmlFor="email">Work email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@yourcompany.com"
          disabled={sending}
        />
        <span className="hint">
          Use the email you claimed your listing with — we&rsquo;ll send a
          one-time sign-in link.
        </span>
      </div>

      {errorMsg && (
        <div className="feature-err" role="alert" style={{ textAlign: "left", marginBottom: 14 }}>
          {errorMsg}
        </div>
      )}

      <button className="btn btn--primary" type="submit" disabled={sending}>
        {sending ? "Sending…" : "Send sign-in link"}
      </button>
    </form>
  );
}
