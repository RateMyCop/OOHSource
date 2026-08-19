"use client";

import { useEffect, useMemo, useState } from "react";
import { Category, Vendor, FORMATS } from "@/lib/types";
import { VendorCard } from "@/components/VendorCard";
import { InfoTip } from "@/components/InfoTip";

const VERIFIED_TIP =
  "Confirmed against the company’s own website and primary sources — not scraped or auto-listed.";

const TIER_RANK: Record<string, number> = { Featured: 0, Free: 1 };
// Render results a page at a time so the directory HTML stays light even
// though the full set is held in memory for instant client-side filtering.
const PAGE_SIZE = 24;

export function DirectoryClient({
  vendors,
  categories,
  initialQuery = "",
}: {
  vendors: Vendor[];
  categories: Category[];
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [cats, setCats] = useState<Set<string>>(new Set());
  const [formats, setFormats] = useState<Set<string>>(new Set());
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  function toggle(set: Set<string>, value: string): Set<string> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

  function reset() {
    setQuery("");
    setCats(new Set());
    setFormats(new Set());
    setVerifiedOnly(false);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return vendors
      .filter((v) => {
        if (cats.size > 0 && !cats.has(v.categorySlug)) return false;
        if (formats.size > 0 && !v.formats.some((f) => formats.has(f)))
          return false;
        if (verifiedOnly && !v.verified) return false;
        if (q) {
          const hay = (
            v.name +
            " " +
            v.subcategory +
            " " +
            v.description +
            " " +
            v.location +
            " " +
            v.specialties.join(" ") +
            " " +
            (v.marketsServed ?? []).join(" ")
          ).toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort(
        (a, b) =>
          TIER_RANK[a.tier] - TIER_RANK[b.tier] || a.name.localeCompare(b.name)
      );
  }, [vendors, query, cats, formats, verifiedOnly]);

  const hasFilters =
    query.trim() !== "" || cats.size > 0 || formats.size > 0 || verifiedOnly;

  // Show the first page; grow on demand. Reset whenever the result set changes.
  const [visible, setVisible] = useState(PAGE_SIZE);
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [query, cats, formats, verifiedOnly]);
  const shown = filtered.slice(0, visible);

  return (
    <div className="dir-layout">
      <aside className="filters">
        <div className="filter-group">
          <span className="fh">Search</span>
          <div className="searchbox">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--ink-3)", flex: "none" }}>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.2-3.2" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, service, city…"
              aria-label="Search vendors"
            />
          </div>
        </div>

        <div className="filter-group">
          <span className="fh">Category</span>
          {categories.map((c) => (
            <label key={c.slug} className="filter-opt">
              <input
                type="checkbox"
                checked={cats.has(c.slug)}
                onChange={() => setCats((s) => toggle(s, c.slug))}
              />
              {c.name}
            </label>
          ))}
        </div>

        <div className="filter-group">
          <span className="fh">Format</span>
          {FORMATS.map((f) => (
            <label key={f} className="filter-opt">
              <input
                type="checkbox"
                checked={formats.has(f)}
                onChange={() => setFormats((s) => toggle(s, f))}
              />
              {f}
            </label>
          ))}
        </div>

        <div className="filter-group">
          <span className="fh">
            Verification
            <InfoTip label={VERIFIED_TIP} />
          </span>
          <label className="filter-opt">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={() => setVerifiedOnly((v) => !v)}
            />
            Verified only
          </label>
        </div>

        {hasFilters && (
          <button className="filter-reset" type="button" onClick={reset}>
            ✕ Clear all filters
          </button>
        )}
      </aside>

      <div>
        <div className="results-top">
          <span className="results-count">
            {filtered.length} {filtered.length === 1 ? "company" : "companies"}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="empty">
            No companies match those filters yet. Try clearing a filter — or{" "}
            <a href="/list-your-company" style={{ color: "var(--accent-strong)" }}>
              add the company yourself
            </a>
            .
          </div>
        ) : (
          <>
            <div className="vgrid">
              {shown.map((v) => (
                <VendorCard key={v.slug} vendor={v} />
              ))}
            </div>
            {visible < filtered.length && (
              <div className="load-more-wrap">
                <button
                  className="load-more"
                  type="button"
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                >
                  Load more — showing {shown.length} of {filtered.length}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
