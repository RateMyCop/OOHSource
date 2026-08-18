import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/lists";
import { PricingIntent } from "@/components/PricingIntent";

export const metadata: Metadata = {
  title: "Pricing — Free & Featured listings",
  description:
    "List your out-of-home company free, or go Featured for top placement in the OOHsource directory. Featured is $50/year.",
  alternates: { canonical: `${SITE_URL}/pricing` },
};

const ROWS: { label: string; free: boolean | string; featured: boolean | string }[] = [
  { label: "Directory listing in your category", free: true, featured: true },
  { label: "Full company description", free: true, featured: true },
  { label: "Website, phone & contact email", free: true, featured: true },
  { label: "Social links", free: true, featured: true },
  { label: "Google & Yelp review ratings", free: true, featured: true },
  { label: "Hero banner image", free: true, featured: true },
  { label: "Claim & keep your details current", free: true, featured: true },
  { label: "Placement in category", free: "Standard", featured: "Top of category" },
  { label: "Search ranking", free: "Standard", featured: "Priority" },
  { label: "Featured badge", free: false, featured: true },
  { label: "Verified badge", free: false, featured: true },
  { label: "Homepage & “Just added” spotlight", free: false, featured: true },
  { label: "Support", free: "Community", featured: "Priority" },
];

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <span className="pc-yes" aria-label="Included">✓</span>;
  if (value === false) return <span className="pc-no" aria-label="Not included">—</span>;
  return <span className="pc-txt">{value}</span>;
}

export default function PricingPage() {
  return (
    <section className="wrap">
      <PricingIntent />
      <div className="page-head">
        <span className="eyebrow">Pricing</span>
        <h1>Get seen by OOH buyers.</h1>
        <p className="lede">
          Every company can list for free. Go Featured to sit at the top of your
          category, earn the Featured &amp; Verified badges, and get spotlighted
          across the site.
        </p>
      </div>

      <div className="plans">
        <div className="plan">
          <div className="plan-name">Free</div>
          <div className="plan-price">
            <span className="amt">$0</span>
            <span className="per">forever</span>
          </div>
          <p className="plan-sub">Everything you need to be found in the directory.</p>
          <Link className="btn btn--ghost plan-cta" href="/list-your-company">
            List your company
          </Link>
          <ul className="plist plan-list">
            <li>Listing in your category</li>
            <li>Description, contact info &amp; socials</li>
            <li>Google &amp; Yelp ratings</li>
            <li>Hero image</li>
            <li>Claim &amp; manage your listing</li>
          </ul>
        </div>

        <div className="plan plan--featured">
          <div className="plan-flag">Featured</div>
          <div className="plan-name">Featured</div>
          <div className="plan-price">
            <span className="amt">$50</span>
            <span className="per">/ year</span>
          </div>
          <p className="plan-promo">
            ⏳ Limited-time launch offer — <strong>$50/yr</strong> available for the
            next 30 days only.
          </p>
          <p className="plan-sub">Top placement and priority everywhere.</p>
          <Link className="btn btn--primary plan-cta" href="/directory">
            Get Featured →
          </Link>
          <p className="plan-fine">
            Open your listing and click <strong>Feature this listing</strong> to
            check out. Not listed yet?{" "}
            <Link href="/list-your-company">Add your company free</Link> first.
          </p>
          <ul className="plist plan-list">
            <li>Everything in Free</li>
            <li>Top of your category</li>
            <li>Priority search ranking</li>
            <li>Featured &amp; Verified badges</li>
            <li>Homepage &amp; spotlight placement</li>
          </ul>
        </div>
      </div>

      <div className="compare">
        <h2>Compare plans</h2>
        <div className="compare-scroll">
          <table className="compare-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Free</th>
                <th className="th-feat">Featured</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.label}>
                  <td>{r.label}</td>
                  <td><Cell value={r.free} /></td>
                  <td className="td-feat"><Cell value={r.featured} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="pricing-faq">
        <div className="faq-item">
          <h3>How does Featured billing work?</h3>
          <p>The $50/year launch price is a limited-time offer available for the next 30 days. Featured is an annual subscription that auto-renews, and you can cancel anytime — your listing stays Featured until the period ends.</p>
        </div>
        <div className="faq-item">
          <h3>What does Featured change?</h3>
          <p>Your listing moves to the top of its category and search results, gains the Featured and Verified badges, and becomes eligible for homepage and spotlight placement.</p>
        </div>
        <div className="faq-item">
          <h3>Is listing really free?</h3>
          <p>Yes. A full free listing includes your description, contact details, socials, review ratings, and a hero image. Featured is purely an upgrade for visibility.</p>
        </div>
      </div>
    </section>
  );
}
