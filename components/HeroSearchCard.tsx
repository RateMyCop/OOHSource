"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// The hero search card. Personalizes the placeholder + a city chip from the
// visitor's approximate city, fetched CLIENT-SIDE from /api/geo on mount. Doing
// it here (rather than reading the geo header in the server page) is what keeps
// the homepage statically generated and edge-cached — the personalization just
// fills in a tick after first paint, with a neutral "your area" fallback.
export function HeroSearchCard() {
  const [city, setCity] = useState("");

  useEffect(() => {
    let alive = true;
    fetch("/api/geo")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d && typeof d.city === "string" && d.city) setCity(d.city);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const searchCity = city || "your area";

  return (
    <div className="searchcard">
      <div className="searchcard-top">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
        <span className="cap">oohsource.com / search</span>
      </div>
      <form className="searchfield" action="/directory">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.2-3.2" />
        </svg>
        <input
          type="text"
          name="q"
          className="searchfield-input"
          placeholder={`Large-format printers in ${searchCity}…`}
          aria-label="Search the directory"
        />
        <button type="submit" className="searchfield-go" aria-label="Search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </form>
      <div className="chips">
        <Link className="chip on" href="/category/printing-production">
          Printing &amp; Production
        </Link>
        <Link className="chip" href="/directory?q=billboards">
          Billboards
        </Link>
        {city && (
          <Link className="chip on" href={`/directory?q=${encodeURIComponent(city)}`}>
            {city}
          </Link>
        )}
        <Link className="chip" href="/directory?verified=1">
          Verified only
        </Link>
      </div>
    </div>
  );
}
