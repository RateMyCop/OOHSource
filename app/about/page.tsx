import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES } from "@/lib/data";
import { getAllVendors } from "@/lib/vendors";
import { SITE_URL } from "@/lib/lists";
import { JsonLd } from "@/components/JsonLd";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "About OOHsource — The Out-of-Home Directory",
  description:
    "OOHsource is the open, vetted directory of the out-of-home advertising industry — media owners, agencies, printers, installers, and technology. Founded by Gino Sesto to keep it accurate, neutral, and public.",
  alternates: { canonical: `${SITE_URL}/about` },
};

export default async function AboutPage() {
  const vendors = await getAllVendors();
  const companyCount = vendors.length;

  const aboutLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    url: `${SITE_URL}/about`,
    mainEntity: {
      "@type": "Organization",
      name: "OOHsource",
      url: SITE_URL,
      description:
        "The open, vetted directory of the global out-of-home advertising industry.",
      founder: { "@type": "Person", name: "Gino Sesto" },
    },
  };

  return (
    <section className="wrap">
      <JsonLd data={aboutLd} />

      <div className="page-head">
        <div className="crumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span>About</span>
        </div>
        <span className="eyebrow">About</span>
        <h1>About OOHsource.</h1>
        <p className="lede">
          OOHsource is the open, vetted directory of the out-of-home advertising
          industry — media owners, agencies, printers, installers, and the
          technology behind them, in one accurate, neutral place.
        </p>
      </div>

      <div className="about-stats">
        <div className="about-stat">
          <span className="about-stat-n">{companyCount.toLocaleString()}</span>
          <span className="about-stat-l">Companies listed</span>
        </div>
        <div className="about-stat">
          <span className="about-stat-n">{CATEGORIES.length}</span>
          <span className="about-stat-l">Categories</span>
        </div>
        <div className="about-stat">
          <span className="about-stat-n">Worldwide</span>
          <span className="about-stat-l">Coverage</span>
        </div>
      </div>

      <div className="method-block">
        <h2>Why OOHsource exists</h2>
        <p className="method-lead">
          Out-of-home is one of the oldest advertising channels and one of the
          hardest to navigate. The companies that own, build, print, install, and
          power OOH are scattered across regions and specialties — and the few
          directories that exist are locked behind logins and paywalls.
        </p>
        <p className="method-note">
          OOHsource is different: it&rsquo;s fully public and free to browse, so
          buyers, sellers, and even AI assistants can actually find the right
          partner. Every listing is organized by role, format, and market, and
          checked against primary sources.
        </p>
      </div>

      <div className="method-block">
        <h2>What makes it different</h2>
        <div className="method-grid">
          <div className="method-card">
            <h3>Neutral &amp; vetted</h3>
            <p>
              Companies are listed on merit and organized transparently. The only
              paid option — Featured — is always clearly labeled, and it never
              changes a company&rsquo;s ratings or score.{" "}
              <Link href="/how-verification-works" className="about-inline-link">
                See how we rank &amp; verify →
              </Link>
            </p>
          </div>
          <div className="method-card">
            <h3>Open by design</h3>
            <p>
              No login wall, no paywall. The whole directory is public and
              crawlable — which is exactly why search engines and AI assistants
              can read and cite it.
            </p>
          </div>
          <div className="method-card">
            <h3>Verified, not scraped</h3>
            <p>
              Listings are built from companies&rsquo; own websites and primary
              sources, and companies can claim and verify their own profiles — we
              don&rsquo;t copy data from other directories.
            </p>
          </div>
        </div>
      </div>

      <div className="method-block">
        <h2>Who runs OOHsource</h2>
        <p className="method-lead">
          OOHsource is an independent directory founded by{" "}
          <strong>Gino Sesto</strong>. It isn&rsquo;t owned by a media company or
          an agency holding group — which is exactly what lets it stay neutral.
        </p>
        <p className="method-note">
          There&rsquo;s a real person accountable for the data here. If something
          looks wrong, tell us and we&rsquo;ll fix it —{" "}
          <Link href="/contact" className="about-inline-link">
            get in touch
          </Link>
          .
        </p>
      </div>

      <div className="method-block">
        <h2>What we stand for</h2>
        <ul className="method-list">
          <li>
            <strong>Accuracy over volume.</strong> A listing is only useful if
            it&rsquo;s right — we check against primary sources and fix what&rsquo;s
            flagged.
          </li>
          <li>
            <strong>Neutrality.</strong> Rankings aren&rsquo;t for sale. Featured
            is labeled placement and nothing more.
          </li>
          <li>
            <strong>Openness.</strong> The directory is public and free to browse,
            for people and machines alike.
          </li>
          <li>
            <strong>Privacy.</strong> We don&rsquo;t sell personal data, and we
            keep contact details to what companies choose to publish.
          </li>
        </ul>
      </div>

      <div className="method-cta">
        <h2>Are you in out-of-home?</h2>
        <p>List your company free, or claim your profile to keep it accurate and get Verified.</p>
        <div className="method-cta-row">
          <Link href="/list-your-company" className="btn btn--primary">List your company</Link>
          <Link href="/how-verification-works" className="btn btn--ghost">How verification works</Link>
        </div>
      </div>
    </section>
  );
}
