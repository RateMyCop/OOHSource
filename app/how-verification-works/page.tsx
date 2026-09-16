import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/lists";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "How verification works",
  description:
    "How OOHsource lists, verifies, and ranks out-of-home companies — what the Verified badge means, how to earn it, where the data comes from, and how rankings are ordered. No black boxes.",
  alternates: { canonical: `${SITE_URL}/how-verification-works` },
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "What does the Verified badge mean?",
    a: "It means a representative of the company has claimed the listing and confirmed control of it from a company-domain email address, and the details have been checked against the company's own website and primary sources. It confirms the listing is genuine and company-controlled — not scraped or auto-generated.",
  },
  {
    q: "Is Verified an endorsement or a quality rating?",
    a: "No. Verified is not a recommendation, an award, or a measure of quality. It only certifies that the listing is authentic and managed by the company itself. Ratings shown on a listing come from third-party review sources, not from OOHsource.",
  },
  {
    q: "Can a company pay to rank higher?",
    a: "A company can pay for a Featured placement, which is always clearly labeled 'Featured' and sits at the top of its category. It does not change the underlying ratings, reviews, or score of any listing, and it never disguises paid placement as merit.",
  },
  {
    q: "How do I get my company verified?",
    a: "Find your listing (or add it for free), click Claim this listing, and confirm from your company email address. When your email domain matches the company's domain, your listing is verified automatically once you confirm.",
  },
  {
    q: "Where does the listing data come from?",
    a: "From companies' own websites and primary industry sources — and from the companies themselves once they claim and manage their listing. We do not copy data from other directories.",
  },
];

const STEPS: { n: string; h: string; p: string }[] = [
  {
    n: "1",
    h: "Find or add your listing",
    p: "Search the directory for your company. Not there yet? Add it free in a couple of minutes.",
  },
  {
    n: "2",
    h: "Claim it from your company email",
    p: "Click “Claim this listing” and confirm from an address at your company’s domain (e.g. you@yourcompany.com).",
  },
  {
    n: "3",
    h: "You’re verified",
    p: "When your email domain matches the company’s, the listing is verified automatically the moment you confirm — and the Verified badge appears.",
  },
];

const SOURCES: { h: string; p: string }[] = [
  {
    h: "Researched",
    p: "We add companies from their own websites and primary industry sources. Researched listings start unverified until a company representative claims them — and we never copy data from other directories.",
  },
  {
    h: "Submitted",
    p: "Anyone can submit a company. Every submission is reviewed before it appears publicly, so the directory stays free of spam and duplicates.",
  },
  {
    h: "Claimed",
    p: "Company representatives claim and manage their own listing. A claim confirmed from a matching company domain is verified automatically.",
  },
];

export default function VerificationPage() {
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <section className="wrap">
      <JsonLd data={faqLd} />

      <div className="page-head">
        <div className="crumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span>How verification works</span>
        </div>
        <span className="eyebrow">Trust</span>
        <h1>How verification works.</h1>
        <p className="lede">
          OOHsource is built to be the accurate, neutral record of the
          out-of-home industry. Here’s exactly how companies get listed, what the
          Verified badge means, and how we rank them — no black boxes.
        </p>
      </div>

      {/* What Verified means */}
      <div className="method-block">
        <div className="method-badge-row">
          <span className="badge badge--verified">
            <span className="v" />
            Verified
          </span>
        </div>
        <h2>What the Verified badge means</h2>
        <p className="method-lead">
          A <strong>Verified</strong> badge means a representative of the company
          has claimed the listing and confirmed control of it from a
          company-domain email address, and the details have been checked against
          the company’s own website and primary sources.
        </p>
        <p className="method-note">
          It is <strong>not</strong> an endorsement, an award, or a quality
          rating — it certifies only that the listing is genuine and
          company-controlled, not scraped or auto-generated. Any star ratings on a
          listing come from third-party review sources, never from OOHsource.
        </p>
      </div>

      {/* How to earn it */}
      <div className="method-block">
        <h2>How a company earns Verified</h2>
        <div className="method-steps">
          {STEPS.map((s) => (
            <div key={s.n} className="method-step">
              <span className="method-step-n">{s.n}</span>
              <h3>{s.h}</h3>
              <p>{s.p}</p>
            </div>
          ))}
        </div>
        <p className="method-note">
          Featured members are verified as part of onboarding. Everyone else can
          verify for free — verification is earned by proving you control the
          listing, not by paying.
        </p>
      </div>

      {/* How companies get listed */}
      <div className="method-block">
        <h2>How companies get listed</h2>
        <div className="method-grid">
          {SOURCES.map((s) => (
            <div key={s.h} className="method-card">
              <h3>{s.h}</h3>
              <p>{s.p}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How we rank */}
      <div className="method-block">
        <h2>How we rank listings</h2>
        <ul className="method-list">
          <li>
            <strong>Featured placements come first</strong> — these are paid and
            always labeled “Featured.” We never disguise paid placement as merit.
          </li>
          <li>
            <strong>Everything below is ordered by a transparent score</strong>:
            verified Google and Yelp ratings, weighted by how many reviews back
            them, plus a factor for geographic coverage.
          </li>
          <li>
            <strong>You’re always in control</strong> — re-sort any list by top
            rating, most reviewed, or A–Z at any time.
          </li>
          <li>
            <strong>Placement is the only thing money changes.</strong> Being
            Featured buys visibility; it never alters a company’s ratings,
            reviews, or score.
          </li>
        </ul>
      </div>

      {/* Keeping data accurate */}
      <div className="method-block">
        <h2>How we keep data accurate</h2>
        <div className="method-grid">
          <div className="method-card">
            <h3>Owners can edit anytime</h3>
            <p>Claimed listings are managed by the company from their dashboard, so details stay current.</p>
          </div>
          <div className="method-card">
            <h3>Anyone can flag a correction</h3>
            <p>Every listing has a “Report an issue” link. Flagged details are re-checked against primary sources.</p>
          </div>
          <div className="method-card">
            <h3>Continuously refreshed</h3>
            <p>Listings revalidate on an ongoing basis, so changes appear without waiting for a manual rebuild.</p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="method-block">
        <h2>Frequently asked</h2>
        <div className="method-faq">
          {FAQ.map((f) => (
            <div key={f.q} className="faq-item">
              <h3>{f.q}</h3>
              <p>{f.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="method-cta">
        <h2>Ready to verify your company?</h2>
        <p>Claim your listing from your company email and get the Verified badge — free.</p>
        <div className="method-cta-row">
          <Link href="/list-your-company" className="btn btn--primary">Claim your listing</Link>
          <Link href="/contact" className="btn btn--ghost">Questions? Contact us</Link>
        </div>
      </div>
    </section>
  );
}
