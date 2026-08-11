"use client";

import { useState } from "react";

type Step = "email" | "code";

export function LoginForm() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function requestCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const em = String(new FormData(e.currentTarget).get("email") || "").trim();
    if (!em) return;
    setBusy(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Something went wrong. Please try again.");
      }
      setEmail(em);
      setStep("code");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get("code") || "").trim();
    setBusy(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Incorrect code.");
      }
      // Full navigation so the server picks up the new session cookie.
      window.location.href = "/dashboard";
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  if (step === "code") {
    return (
      <form onSubmit={verifyCode} className="form-wrap" style={{ maxWidth: 440 }}>
        <div className="form-ok show" role="status" style={{ marginBottom: 20 }}>
          ✓ If <strong>{email}</strong> is on a confirmed listing, we&rsquo;ve
          emailed a 6-digit code. Enter it below.
        </div>
        <div className="field">
          <label htmlFor="code">6-digit code</label>
          <input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            placeholder="••••••"
            required
            autoFocus
            disabled={busy}
            style={{ letterSpacing: "0.4em", fontFamily: "var(--font-mono), monospace" }}
          />
          <span className="hint">The code expires in 10 minutes.</span>
        </div>

        {errorMsg && (
          <div className="feature-err" role="alert" style={{ textAlign: "left", marginBottom: 14 }}>
            {errorMsg}
          </div>
        )}

        <button className="btn btn--primary" type="submit" disabled={busy}>
          {busy ? "Verifying…" : "Sign in"}
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          style={{ marginLeft: 10 }}
          disabled={busy}
          onClick={() => {
            setStep("email");
            setErrorMsg("");
          }}
        >
          Use a different email
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={requestCode} className="form-wrap" style={{ maxWidth: 440 }}>
      <div className="field">
        <label htmlFor="email">Work email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@yourcompany.com"
          disabled={busy}
        />
        <span className="hint">
          Use the email you claimed your listing with — we&rsquo;ll email you a
          6-digit sign-in code.
        </span>
      </div>

      {errorMsg && (
        <div className="feature-err" role="alert" style={{ textAlign: "left", marginBottom: 14 }}>
          {errorMsg}
        </div>
      )}

      <button className="btn btn--primary" type="submit" disabled={busy}>
        {busy ? "Sending…" : "Email me a code"}
      </button>
    </form>
  );
}
