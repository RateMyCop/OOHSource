import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/lists";
import { JsonLd } from "@/components/JsonLd";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with OOHsource — claim or correct a listing, ask about Featured placement, press, or partnerships. We reply within one business day.",
  alternates: { canonical: `${SITE_URL}/contact` },
};

const CONTACT_EMAIL = "hello@oohsource.com";

export default function ContactPage() {
  const contactLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact OOHsource",
    url: `${SITE_URL}/contact`,
    mainEntity: {
      "@type": "Organization",
      name: "OOHsource",
      url: SITE_URL,
      email: CONTACT_EMAIL,
      founder: { "@type": "Person", name: "Gino Sesto" },
    },
  };

  return (
    <section className="wrap">
      <JsonLd data={contactLd} />
      <div className="page-head">
        <div className="crumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span>Contact</span>
        </div>
        <span className="eyebrow">Contact</span>
        <h1>Get in touch.</h1>
        <p className="lede">
          Questions about a listing, Featured placement, press, or partnerships —
          send a note and a real person will get back to you, usually within one
          business day.
        </p>
      </div>

      <div className="contact-grid">
        <div className="contact-form-col">
          <ContactForm />
        </div>

        <aside className="contact-aside">
          <div className="aside-card">
            <span className="k">Email us</span>
            <a className="contact-email" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
            <p className="badge-embed-intro" style={{ marginTop: 8 }}>
              Prefer email? Write to us directly and we&rsquo;ll reply from the
              same address.
            </p>
          </div>

          <div className="aside-card">
            <span className="k" style={{ marginBottom: 8 }}>Common requests</span>
            <ul className="contact-links">
              <li>
                <Link href="/list-your-company">Add or claim your company</Link>
                <span>List for free or claim an existing profile.</span>
              </li>
              <li>
                <Link href="/pricing">Featured placement</Link>
                <span>Top-of-category visibility and badges.</span>
              </li>
              <li>
                <Link href="/directory">Correct a listing</Link>
                <span>Open the profile and use “Report an issue”.</span>
              </li>
            </ul>
          </div>

          <div className="aside-card">
            <span className="k">Who runs OOHsource</span>
            <p className="badge-embed-intro" style={{ marginTop: 8 }}>
              OOHsource is an independent directory founded by{" "}
              <strong>Gino Sesto</strong>. We keep the listings neutral and the
              data accurate — tell us if anything looks off.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
