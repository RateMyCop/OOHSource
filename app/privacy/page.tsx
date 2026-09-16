import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/lists";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How OOHsource collects, uses, and protects information — what we gather, the services we rely on, your choices, and how to reach us.",
  alternates: { canonical: `${SITE_URL}/privacy` },
};

const UPDATED = "September 16, 2026";

export default function PrivacyPage() {
  return (
    <section className="wrap">
      <div className="page-head">
        <div className="crumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span>Privacy</span>
        </div>
        <span className="eyebrow">Legal</span>
        <h1>Privacy Policy</h1>
        <p className="legal-meta">Last updated: {UPDATED}</p>
      </div>

      <div className="legal">
        <p>
          OOHsource (“OOHsource,” “we,” “us”) operates the out-of-home advertising
          directory at oohsource.com. This policy explains what information we
          collect, how we use it, who we share it with, and the choices you have.
          Questions? Email{" "}
          <a href="mailto:hello@oohsource.com">hello@oohsource.com</a> or use our{" "}
          <Link href="/contact">contact page</Link>.
        </p>

        <h2>Information we collect</h2>
        <h3>Information you give us</h3>
        <ul>
          <li>
            <strong>Listing submissions and claims</strong> — company name,
            website, category, contact details, and anything you add to a listing
            you manage.
          </li>
          <li>
            <strong>Account details</strong> — the email address you use to sign
            in. We use passwordless “magic link” sign-in, so we never collect or
            store a password.
          </li>
          <li>
            <strong>Messages</strong> — the name, email, company, and content you
            send through our contact, claim, or report forms.
          </li>
        </ul>

        <h3>Business listing information</h3>
        <p>
          Listings are built from companies’ own websites and other primary,
          publicly available industry sources. This is business information (such
          as a company’s name, services, location, and public contact details),
          and by nature it is displayed publicly on the site. We do not copy data
          from other directories.
        </p>

        <h3>Information collected automatically</h3>
        <ul>
          <li>
            <strong>Usage and device data</strong> — pages viewed, referring
            links, approximate location, browser and device type, collected
            through analytics.
          </li>
          <li>
            <strong>Aggregate listing activity</strong> — counts of profile views
            and clicks, used to give listing owners simple stats. These counts are
            not tied to your identity.
          </li>
          <li>
            <strong>Cookies and similar technologies</strong> — see “Cookies and
            analytics” below.
          </li>
        </ul>

        <h3>Payment information</h3>
        <p>
          Featured placements are billed through <strong>Stripe</strong>. Stripe
          collects and processes your card details directly under its own privacy
          policy — <strong>we never see or store full card numbers.</strong> We
          keep a record of the transaction (such as the plan, amount, and status).
        </p>

        <h2>How we use information</h2>
        <ul>
          <li>Operate, maintain, and improve the directory.</li>
          <li>Verify listings and confirm that a claim is made by the company.</li>
          <li>Respond to your messages and support requests.</li>
          <li>Process Featured payments and manage subscriptions.</li>
          <li>
            Send you service emails (sign-in links, confirmations, receipts) and a
            limited number of relevant updates about your listing — which you can
            opt out of at any time.
          </li>
          <li>Understand usage, measure performance, and prevent abuse or fraud.</li>
        </ul>

        <h2>Cookies and analytics</h2>
        <p>
          We use a small number of cookies and similar technologies:
        </p>
        <ul>
          <li>
            <strong>Essential</strong> — a secure, http-only session cookie keeps
            you signed in to your owner dashboard. The site can’t work without it.
          </li>
          <li>
            <strong>Analytics</strong> — we use <strong>Google Analytics</strong>{" "}
            to understand how the site is used. You can opt out with Google’s
            browser add-on or by blocking analytics cookies.
          </li>
          <li>
            <strong>Payments</strong> — Stripe may set cookies during checkout to
            process your payment securely and prevent fraud.
          </li>
          <li>
            <strong>Preferences</strong> — your light/dark theme choice is stored
            locally in your browser and never leaves your device.
          </li>
        </ul>

        <h2>Emails and your choices</h2>
        <p>
          Service emails (sign-in links, confirmations, receipts) are part of
          using the site. Promotional emails — such as a note about Featured — are
          limited and optional: every one includes an unsubscribe link, and
          opting out is honored across all promotional mail. To stop all email,
          contact us and we’ll remove you.
        </p>

        <h2>How we share information</h2>
        <p>
          We do <strong>not</strong> sell your personal information. We share
          information only with the service providers that help us run OOHsource,
          and only as needed:
        </p>
        <ul>
          <li><strong>Vercel</strong> — website hosting and image storage.</li>
          <li><strong>Airtable</strong> — the database behind our listings.</li>
          <li><strong>Stripe</strong> — payment processing for Featured.</li>
          <li><strong>Resend</strong> — sending our emails.</li>
          <li><strong>Google Analytics</strong> — usage measurement.</li>
          <li><strong>Upstash</strong> — aggregate view/click counts.</li>
        </ul>
        <p>
          We may also disclose information if required by law, to protect our
          rights or users, or as part of a business transfer. Public listing
          information is, by design, visible to anyone who uses the site.
        </p>

        <h2>Data retention</h2>
        <p>
          We keep information for as long as needed to run the directory and meet
          legal or accounting obligations. Listing data remains while a company is
          listed; message and account data is kept while your account is active
          and for a reasonable period afterward.
        </p>

        <h2>Security</h2>
        <p>
          We take reasonable measures to protect information — including encrypted
          connections, passwordless sign-in, and limiting access to data. No
          system is perfectly secure, but we work to keep yours safe.
        </p>

        <h2>Your rights</h2>
        <p>
          Depending on where you live, you may have the right to access, correct,
          or delete your personal information, or to object to certain uses. To
          exercise any of these, email{" "}
          <a href="mailto:hello@oohsource.com">hello@oohsource.com</a>. If you’re a
          company and want a listing corrected or removed, you can claim it,{" "}
          <Link href="/directory">use “Report an issue”</Link> on the listing, or
          contact us.
        </p>

        <h2>International users</h2>
        <p>
          OOHsource is operated from the United States and relies on service
          providers there and elsewhere. By using the site, you understand your
          information may be processed in the United States and other countries.
        </p>

        <h2>Children</h2>
        <p>
          OOHsource is a business directory intended for professional use. It is
          not directed to children, and we do not knowingly collect information
          from anyone under 16.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          We may update this policy from time to time. When we do, we’ll revise
          the “Last updated” date above, and significant changes will be made
          clear on this page.
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
