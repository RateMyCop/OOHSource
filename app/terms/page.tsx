import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/lists";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "The terms that govern your use of OOHsource — how listings work, Featured placements and billing, acceptable use, and the usual legal terms.",
  alternates: { canonical: `${SITE_URL}/terms` },
};

const UPDATED = "September 16, 2026";

export default function TermsPage() {
  return (
    <section className="wrap">
      <div className="page-head">
        <div className="crumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span>Terms</span>
        </div>
        <span className="eyebrow">Legal</span>
        <h1>Terms of Use</h1>
        <p className="legal-meta">Last updated: {UPDATED}</p>
      </div>

      <div className="legal">
        <p>
          These Terms of Use (“Terms”) govern your access to and use of OOHsource
          (“OOHsource,” “we,” “us”) at oohsource.com (the “Site”). By using the
          Site, you agree to these Terms. If you don’t agree, please don’t use the
          Site.
        </p>

        <h2>What OOHsource is</h2>
        <p>
          OOHsource is an informational directory of the out-of-home advertising
          industry. We help buyers and companies find each other, but we are{" "}
          <strong>not a party to any transaction</strong> between them and do not
          broker, endorse, or guarantee any company, service, or deal. Any
          engagement you enter into with a listed company is solely between you
          and that company.
        </p>

        <h2>Listings and accuracy</h2>
        <p>
          Listings are compiled from companies’ own websites and primary public
          sources, and from the companies themselves once they claim a listing.
          We work to keep information accurate, but it is provided{" "}
          <strong>“as is,” without warranty</strong>. A{" "}
          <strong>Verified</strong> badge means a listing has been confirmed as
          company-controlled and checked against primary sources — it is{" "}
          <strong>not</strong> an endorsement or a rating of quality. See{" "}
          <Link href="/how-verification-works">how verification works</Link>.
        </p>

        <h2>Claiming and managing a listing</h2>
        <p>
          If you claim or manage a listing, you represent that you are authorized
          to act for that company, and you agree to provide accurate, current
          information and to keep it up to date. You are responsible for the
          content you add. We may review, edit, or remove listings or content that
          is inaccurate, misleading, unlawful, or in breach of these Terms.
        </p>

        <h2>Featured placements and billing</h2>
        <ul>
          <li>
            <strong>What it is.</strong> Featured is a paid upgrade that gives a
            listing top placement in its category, priority in search, and added
            badges and spotlight placement.
          </li>
          <li>
            <strong>Price and renewal.</strong> Featured is an annual subscription
            billed through Stripe. It <strong>auto-renews</strong> each year at the
            then-current price unless cancelled before the renewal date.
          </li>
          <li>
            <strong>Cancellation.</strong> You can cancel anytime; your listing
            stays Featured until the end of the paid period, after which it reverts
            to a free listing. Fees already paid are generally non-refundable
            except where required by law.
          </li>
          <li>
            <strong>Placement only.</strong> Featured changes visibility and
            placement. It never alters a company’s ratings, reviews, or the
            underlying score used to order listings.
          </li>
        </ul>

        <h2>Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Scrape, harvest, or bulk-copy the Site’s data or content.</li>
          <li>Submit false, misleading, or fraudulent information, or impersonate a company or person.</li>
          <li>Claim a listing you are not authorized to manage.</li>
          <li>Use the Site to send spam or to violate any law or third-party right.</li>
          <li>Interfere with, disrupt, or attempt to gain unauthorized access to the Site or its systems.</li>
        </ul>

        <h2>Intellectual property</h2>
        <p>
          The Site’s design, text, and original content belong to OOHsource.
          Company names, logos, and marks shown in listings belong to their
          respective owners and are used to identify those companies. If we offer
          an OOHsource badge to embed on your own site, you may use it only to link
          back to your OOHsource listing.
        </p>

        <h2>Third-party links</h2>
        <p>
          Listings and pages may link to third-party websites. We don’t control
          and aren’t responsible for their content, products, or practices.
          Visiting them is at your own risk and subject to their terms.
        </p>

        <h2>Removal and corrections</h2>
        <p>
          If information about your company is wrong, or you want your listing
          corrected or removed, claim it,{" "}
          <Link href="/directory">use “Report an issue”</Link> on the listing, or{" "}
          <Link href="/contact">contact us</Link>. We handle reasonable requests
          promptly.
        </p>

        <h2>Disclaimers</h2>
        <p>
          The Site and all information on it are provided “as is” and “as
          available,” without warranties of any kind, whether express or implied,
          including fitness for a particular purpose, accuracy, or
          non-infringement. We do not warrant that the Site will be uninterrupted,
          error-free, or that any listing is complete or current.
        </p>

        <h2>Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, OOHsource and its founder will
          not be liable for any indirect, incidental, special, or consequential
          damages, or for any loss arising from your use of the Site or your
          dealings with any listed company. Our total liability for any claim
          relating to the Site will not exceed the amount you paid us, if any, in
          the twelve months before the claim.
        </p>

        <h2>Indemnification</h2>
        <p>
          You agree to indemnify and hold harmless OOHsource and its founder from
          any claims, losses, or expenses arising out of your use of the Site,
          your content, or your breach of these Terms.
        </p>

        <h2>Termination</h2>
        <p>
          We may suspend or terminate access to the Site or a listing at our
          discretion, including for breach of these Terms. You may stop using the
          Site at any time.
        </p>

        <h2>Governing law</h2>
        <p>
          These Terms are governed by the laws of the State of Wyoming, USA,
          without regard to its conflict-of-laws rules, and any dispute will be
          resolved in the courts located there.
        </p>

        <h2>Changes to these Terms</h2>
        <p>
          We may update these Terms from time to time. When we do, we’ll revise
          the “Last updated” date above. Your continued use of the Site after a
          change means you accept the updated Terms.
        </p>

        <h2>Contact us</h2>
        <p>
          OOHsource · P.O. Box 3787, Alpine, WY 83128 ·{" "}
          <a href="mailto:hello@oohsource.com">hello@oohsource.com</a>
        </p>
      </div>
    </section>
  );
}
