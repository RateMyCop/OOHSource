"use client";

import { useState } from "react";
import { CATEGORIES } from "@/lib/data";
import { FORMATS } from "@/lib/types";

export default function ListYourCompanyPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Phase 2: POST this to an API route / Airtable / database.
    // For now we confirm the submission on the client.
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

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
        <div className={`form-ok${submitted ? " show" : ""}`} role="status">
          ✓ Thanks — your listing has been submitted for review. We&rsquo;ll verify
          the details and publish it shortly.
        </div>

        {!submitted && (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="name">Company name *</label>
              <input id="name" name="name" type="text" required />
            </div>

            <div className="field">
              <label htmlFor="website">Website *</label>
              <input
                id="website"
                name="website"
                type="url"
                placeholder="https://"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="category">Category *</label>
              <select id="category" name="category" required defaultValue="">
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
              />
            </div>

            <div className="field">
              <label>Formats you work in</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px" }}>
                {FORMATS.map((f) => (
                  <label key={f} className="filter-opt">
                    <input type="checkbox" name="formats" value={f} />
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
              />
            </div>

            <div className="field">
              <label htmlFor="coverage">Coverage</label>
              <select id="coverage" name="coverage" defaultValue="Regional">
                <option>Worldwide</option>
                <option>National</option>
                <option>Regional</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="description">Short description</label>
              <textarea
                id="description"
                name="description"
                placeholder="One or two sentences on what your company does."
              />
            </div>

            <div className="field">
              <label htmlFor="email">Your email *</label>
              <input id="email" name="email" type="email" required />
              <span className="hint">
                Used only to verify the listing — never published.
              </span>
            </div>

            <label className="checkline" style={{ margin: "6px 0 22px" }}>
              <input type="checkbox" required />
              <span>
                I confirm the details are accurate and I&rsquo;m authorised to list
                this company.
              </span>
            </label>

            <button className="btn btn--primary" type="submit">
              Submit listing
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
