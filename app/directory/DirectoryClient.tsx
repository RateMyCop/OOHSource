"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Category, Vendor, FORMATS } from "@/lib/types";
import { VendorCard } from "@/components/VendorCard";
import { InfoTip } from "@/components/InfoTip";

const VERIFIED_TIP =
  "Confirmed against the company’s own website and primary sources — not scraped or auto-listed.";

const TIER_RANK: Record<string, number> = { Featured: 0, Free: 1 };
// Render results a page at a time so the directory HTML stays light even
// though the full set is held in memory for instant client-side filtering.
const PAGE_SIZE = 24;

type SortKey = "featured" | "rating" | "reviews" | "name";
const SORTS: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Featured first" },
  { key: "rating", label: "Top rated" },
  { key: "reviews", label: "Most reviewed" },
  { key: "name", label: "Name (A–Z)" },
];

export function DirectoryClient({
  vendors,
  categories,
  initialQuery = "",
  initialCategories = [],
  initialFormats = [],
  initialVerified = false,
  initialSort = "",
}: {
  vendors: Vendor[];
  categories: Category[];
  initialQuery?: string;
  initialCategories?: string[];
  initialFormats?: string[];
  initialVerified?: boolean;
  initialSort?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [cats, setCats] = useState<Set<string>>(() => new Set(initialCategories));
  const [formats, setFormats] = useState<Set<string>>(
    () => new Set(initialFormats)
  );
  const [verifiedOnly, setVerifiedOnly] = useState(initialVerified);
  const [sort, setSort] = useState<SortKey>(
    SORTS.some((s) => s.key === initialSort) ? (initialSort as SortKey) : "featured"
  );

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
      });
  }, [vendors, query, cats, formats, verifiedOnly]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const byName = (a: Vendor, b: Vendor) => a.name.localeCompare(b.name);
    switch (sort) {
      case "rating":
        return arr.sort(
          (a, b) =>
            (b.googleRating ?? -1) - (a.googleRating ?? -1) ||
            (b.googleReviews ?? 0) - (a.googleReviews ?? 0) ||
            byName(a, b)
        );
      case "reviews":
        return arr.sort(
          (a, b) => (b.googleReviews ?? -1) - (a.googleReviews ?? -1) || byName(a, b)
        );
      case "name":
        return arr.sort(byName);
      default:
        return arr.sort(
          (a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier] || byName(a, b)
        );
    }
  }, [filtered, sort]);

  const hasFilters =
    query.trim() !== "" || cats.size > 0 || formats.size > 0 || verifiedOnly;

  // Show the first page; grow on demand. Reset whenever the result set changes.
  const [visible, setVisible] = useState(PAGE_SIZE);
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [query, cats, formats, verifiedOnly, sort]);
  const shown = sorted.slice(0, visible);

  // Keep the URL in sync with the active filters so a filtered view is
  // shareable/bookmarkable and shared links SSR the same set (the server reads
  // these params on first load). replaceState avoids any refetch/re-render.
  const firstSync = useRef(true);
  useEffect(() => {
    if (firstSync.current) {
      firstSync.current = false;
      return;
    }
    const p = new URLSearchParams();
    if (query.trim()) p.set("q", query.trim());
    if (cats.size) p.set("category", Array.from(cats).join(","));
    if (formats.size) p.set("format", Array.from(formats).join(","));
    if (verifiedOnly) p.set("verified", "1");
    if (sort !== "featured") p.set("sort", sort);
    const qs = p.toString();
    window.history.replaceState(
      null,
      "",
      qs ? `${window.location.pathname}?${qs}` : window.location.pathname
    );
  }, [query, cats, formats, verifiedOnly, sort]);

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
            {sorted.length} {sorted.length === 1 ? "company" : "companies"}
          </span>
          <label className="sort-control">
            <span className="sort-label">Sort</span>
            <select
              className="sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Sort results"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
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
