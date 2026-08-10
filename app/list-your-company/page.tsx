"use client";

import { useState } from "react";
import { CATEGORIES } from "@/lib/data";
import { FORMATS } from "@/lib/types";

type Status = "idle" | "submitting" | "done" | "error";

export default function ListYourCompanyPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [verifyPending, setVerifyPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    const payload = {
      name: fd.get("name"),
      website: fd.get("website"),
      category: fd.get("category"),
      subcategory: fd.get("subcategory"),
      formats: fd.getAll("formats"),
      location: fd.get("location"),
      address: fd.get("address"),
      phone: fd.get("phone"),
      coverage: fd.get("coverage"),
      marketsServed: fd.get("marketsServed"),
      description: fd.get("description"),
      contactEmail: fd.get("contactEmail"),
      x: fd.get("x"),
      linkedin: fd.get("linkedin"),
      facebook: fd.get("facebook"),
      instagram: fd.get("instagram"),
      youtube: fd.get("youtube"),
      contactName: fd.get("contactName"),
      email: fd.get("email"),
      company_url: fd.get("company_url"), // honeypot
    };

    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Submission failed. Please try again.");
      }
      const data = await res.json().catch(() => ({}));
      setVerifyPending(Boolean(data.verify));
      setStatus("done");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      setStatus("error");
    }
  }

  const submitting = status === "submitting";

  return (
    <section className="wrap page-head" style={{ paddingBottom: 80 }}>
      <div className="crumb">
        <a href="/">Home</a>
        <span>/</span>
        <span>List your company</span>
      </div>
      <h1>List your company.</h1>
      <p className="lede" style={{ marginBottom: 34 }}>
        Add your company to the global out-of-home directory. Free, always — a
        listing takes a couple of minutes.
      </p>

      <div className="form-wrap">
        <div className={`form-ok${status === "done" ? " show" : ""}`} role="status">
          {verifyPending
            ? "✓ Almost there — check your email and click the confirmation link to send your listing for review."
            : "✓ Thanks — your listing has been submitted for review. We'll verify the details and publish it shortly."}
        </div>

        {status !== "done" && (
          <form onSubmit={handleSubmit}>
            {/* honeypot — hidden from humans */}
            <input
              type="text"
              name="company_url"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }}
            />

            <div className="field">
              <label htmlFor="name">Company name *</label>
              <input id="name" name="name" type="text" required disabled={submitting} />
            </div>

            <div className="field">
              <label htmlFor="website">Website *</label>
              <input
                id="website"
                name="website"
                type="url"
                placeholder="https://"
                required
                disabled={submitting}
              />
            </div>

            <div className="field">
              <label htmlFor="category">Category *</label>
              <select id="category" name="category" required defaultValue="" disabled={submitting}>
                <option value="" disabled>
                  Select a category…
                </option>
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="subcategory">What do you do? (role)</label>
              <input
                id="subcategory"
                name="subcategory"
                type="text"
                placeholder="e.g. Large-format printer"
                disabled={submitting}
              />
            </div>

            <div className="field">
              <label>Formats you work in</label>
              <div className="check-grid">
                {FORMATS.map((f) => (
                  <label key={f} className="filter-opt">
                    <input type="checkbox" name="formats" value={f} disabled={submitting} />
                    {f}
                  </label>
                ))}
              </div>
            </div>

            <div className="field">
              <label htmlFor="location">Location (city, country)</label>
              <input
                id="location"
                name="location"
                type="text"
                placeholder="e.g. London, UK"
                disabled={submitting}
              />
            </div>

            <div className="field">
              <label htmlFor="address">Full address</label>
              <input
                id="address"
                name="address"
                type="text"
                placeholder="Street, city, state, ZIP (optional)"
                disabled={submitting}
              />
              <span className="hint">
                Optional — helpful for local printers, installers, and sign shops.
              </span>
            </div>

            <div className="field">
              <label htmlFor="phone">Phone</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="Optional"
                disabled={submitting}
              />
            </div>

            <div className="field">
              <label htmlFor="coverage">Coverage</label>
              <select id="coverage" name="coverage" defaultValue="Regional" disabled={submitting}>
                <option>Worldwide</option>
                <option>National</option>
                <option>Regional</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="marketsServed">Markets served</label>
              <input
                id="marketsServed"
                name="marketsServed"
                type="text"
                placeholder="e.g. TX, CA, FL, IL"
                disabled={submitting}
              />
              <span className="hint">
                Optional — comma-separated states or metros for multi-location
                companies.
              </span>
            </div>

            <div className="field">
              <label htmlFor="description">Short description</label>
              <textarea
                id="description"
                name="description"
                placeholder="One or two sentences on what your company does."
                disabled={submitting}
              />
            </div>

            <div className="field">
              <label htmlFor="contactEmail">Public contact email</label>
              <input
                id="contactEmail"
                name="contactEmail"
                type="email"
                placeholder="Optional — shown on your listing"
                disabled={submitting}
              />
              <span className="hint">
                Shown publicly so buyers can reach you. (Different from your login
                email below.)
              </span>
            </div>

            <div className="field">
              <label>Social links (optional)</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input name="x" type="url" placeholder="X / Twitter URL" disabled={submitting} />
                <input name="linkedin" type="url" placeholder="LinkedIn URL" disabled={submitting} />
                <input name="facebook" type="url" placeholder="Facebook URL" disabled={submitting} />
                <input name="instagram" type="url" placeholder="Instagram URL" disabled={submitting} />
                <input name="youtube" type="url" placeholder="YouTube URL" disabled={submitting} />
              </div>
            </div>

            <div className="field">
              <label htmlFor="contactName">Contact name</label>
              <input
                id="contactName"
                name="contactName"
                type="text"
                placeholder="Optional"
                disabled={submitting}
              />
              <span className="hint">
                Internal only — used to verify the listing, never published.
              </span>
            </div>

            <div className="field">
              <label htmlFor="email">Your email *</label>
              <input id="email" name="email" type="email" required disabled={submitting} />
              <span className="hint">
                Used only to verify the listing — never published.
              </span>
            </div>

            <label className="checkline" style={{ margin: "6px 0 22px" }}>
              <input type="checkbox" required disabled={submitting} />
              <span>
                I confirm the details are accurate and I&rsquo;m authorised to list
                this company.
              </span>
            </label>

            {status === "error" && (
              <div
                role="alert"
                style={{
                  marginBottom: 18,
                  padding: "12px 14px",
                  border: "1px solid var(--accent-strong)",
                  borderRadius: "var(--radius)",
                  color: "var(--accent-strong)",
                  fontFamily: "var(--font-display), sans-serif",
                  fontSize: "0.92rem",
                }}
              >
                {errorMsg}
              </div>
            )}

            <button className="btn btn--primary" type="submit" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit listing"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
