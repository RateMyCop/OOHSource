import Link from "next/link";
import { headers } from "next/headers";
import { CATEGORIES } from "@/lib/data";
import { FORMATS } from "@/lib/types";

export default function HomePage() {
  // Personalize the hero search from the visitor's approximate city (Vercel edge
  // geolocation, derived from IP — no permission prompt, no cookie). Falls back
  // gracefully in dev / when unavailable.
  const rawCity = headers().get("x-vercel-ip-city");
  const city = rawCity ? decodeURIComponent(rawCity.replace(/\+/g, " ")) : "";
  const searchCity = city || "your area";

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <span className="eyebrow">
              <span className="label label--accent">
                The global out-of-home (OOH) directory
              </span>
            </span>
            <h1>
              The whole out-of-home industry, <span className="hl">in one place.</span>
            </h1>
            <div className="hero-cta">
              <Link className="btn btn--primary" href="/list-your-company">
                List your company — free
              </Link>
              <Link className="btn btn--ghost" href="/directory">
                Browse the directory
              </Link>
            </div>
            <p className="hero-fine">Free to list · Worldwide · Every OOH format</p>
          </div>

          <div className="hero-visual">
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
                <Link className="chip" href="/directory">
                  Verified only
                </Link>
              </div>
              <Link className="search-result" href="/directory/circle-graphics">
                <div>
                  <div className="co">Circle Graphics<span className="pill-new">Just added</span></div>
                  <div className="meta">Large-format printer · National</div>
                </div>
                <span className="verified">
                  <span className="v" />
                  Verified
                </span>
              </Link>
              <Link className="search-result" href="/directory/britten">
                <div>
                  <div className="co">Britten<span className="pill-new">Just added</span></div>
                  <div className="meta">Grand format · Bulletins · Wraps</div>
                </div>
                <span className="verified">
                  <span className="v" />
                  Verified
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* COVERAGE */}
      <div className="coverage">
        <div className="wrap">
          <div className="coverage-grid">
            <div className="cov">
              <div className="n">6</div>
              <div className="t">Categories</div>
            </div>
            <div className="cov">
              <div className="n">22+</div>
              <div className="t">Subcategories</div>
            </div>
            <div className="cov">
              <div className="n">6</div>
              <div className="t">Media formats</div>
            </div>
            <div className="cov">
              <div className="n">Global</div>
              <div className="t">Coverage</div>
            </div>
          </div>
        </div>
      </div>

      {/* CATEGORIES */}
      <section className="block" id="categories">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">
              <span className="label">What&rsquo;s in the directory</span>
            </span>
            <h2>Every link in the out-of-home chain.</h2>
            <p className="lede">
              Search by what a company does, the formats they run, and the markets
              they serve — the three questions every OOH buyer actually asks.
            </p>
          </div>

          <div className="ruled cols-3">
            {CATEGORIES.map((c) => (
              <Link key={c.slug} className="cat" href={`/category/${c.slug}`}>
                <h3>{c.name}</h3>
                <ul>
                  {c.subcategories.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
                <span className="cat-link">Browse →</span>
              </Link>
            ))}
          </div>

          <div className="formats">
            <span className="lab">Filter by format</span>
            {FORMATS.map((f) => (
              <span key={f} className="fmt">
                {f}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* WHY */}
      <section className="block why">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">
              <span className="label">Why OOHsource</span>
            </span>
            <h2>The directory the industry deserves.</h2>
          </div>
          <div className="values">
            <div className="value">
              <svg className="vico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <span className="vk">Vetted, not scraped</span>
              <h3>Every listing verified against the source.</h3>
              <p>
                Company data confirmed from primary sources and kept current — not
                copied once and left to go stale.
              </p>
            </div>
            <div className="value">
              <svg className="vico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <span className="vk">Searchable three ways</span>
              <h3>Role × format × market.</h3>
              <p>
                Filter to exactly what you need — &ldquo;DOOH networks in
                Berlin,&rdquo; &ldquo;printers in São Paulo&rdquo; — in seconds.
              </p>
            </div>
            <div className="value">
              <svg className="vico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M12 3v18" />
                <path d="M4 7h16" />
                <path d="M6 7l-2.5 6a3 3 0 0 0 5 0L6 7zM18 7l-2.5 6a3 3 0 0 0 5 0L18 7z" />
              </svg>
              <span className="vk">Neutral ground</span>
              <h3>No side favored.</h3>
              <p>
                Owners, agencies, and printers listed side by side. Independent of
                any one company or association.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section className="block" id="vendors">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">
              <span className="label">For vendors</span>
            </span>
            <h2>Get found by the buyers looking for you.</h2>
            <p className="lede">
              Printers, installers, media owners, agencies — claim your place in the
              directory before your competitor does.
            </p>
          </div>
          <div className="ruled cols-3">
            <div className="step">
              <h3>Claim your listing</h3>
              <p>Find your company or add it in minutes. Listing is free, always.</p>
            </div>
            <div className="step">
              <h3>Get discovered</h3>
              <p>
                Buyers filter by role, format, and market — and land on you, with
                your verified badge.
              </p>
            </div>
            <div className="step">
              <h3>Stand out</h3>
              <p>
                Go Featured to top your category and get spotlighted when
                you&rsquo;re ready to grow.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SPLIT */}
      <section className="block" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="split">
            <div className="panel panel--vendor">
              <span className="label">List your company</span>
              <h3>Own your listing.</h3>
              <p>
                Claim it free, keep your details accurate, and earn the verified
                badge buyers filter for.
              </p>
              <ul className="plist">
                <li>Free forever — no card required</li>
                <li>Verified badge on approval</li>
                <li>Featured placement when you want it</li>
              </ul>
              <Link className="btn btn--primary" href="/list-your-company">
                Add my company
              </Link>
            </div>
            <div className="panel panel--buyer">
              <span className="label">For buyers &amp; planners</span>
              <h3>Source a campaign in minutes.</h3>
              <p>
                Shortlist vetted OOH vendors by role, format, and market — without
                cold-emailing the whole industry.
              </p>
              <ul className="plist">
                <li>One search across the whole supply chain</li>
                <li>Verified vendors, current details</li>
                <li>Neutral — no broker in the middle</li>
              </ul>
              <Link className="btn btn--ghost" href="/directory">
                Browse the directory
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* GET LISTED */}
      <section className="block text-center">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">
              <span className="label">Get listed</span>
            </span>
            <h2>Put your company on the map.</h2>
            <p className="lede">
              Add your company to the directory in minutes — free — and get found by
              buyers sourcing OOH worldwide.
            </p>
          </div>
          <div className="center-cta">
            <Link className="btn btn--primary" href="/list-your-company">
              List your company — free
            </Link>
            <Link className="btn btn--ghost" href="/directory">
              Browse the directory
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
