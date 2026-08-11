import type { Metadata } from "next";
import Link from "next/link";
import { readUnsubToken } from "@/lib/outreach";
import { AutoUnsubscribe } from "@/components/AutoUnsubscribe";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

export default function UnsubscribePage({
  searchParams,
}: {
  searchParams: { t?: string; done?: string };
}) {
  const { t, done } = searchParams;

  // Result states (after the POST).
  if (done === "1") {
    return (
      <Shell label="Unsubscribed" heading="You're unsubscribed.">
        You won&rsquo;t receive any more outreach emails from OOHsource. Your
        directory listing stays live — you can still claim or update it anytime.
      </Shell>
    );
  }
  if (done === "0") {
    return (
      <Shell label="Invalid link" heading="This link didn't work.">
        We couldn&rsquo;t process that request. Reply to the email with
        &ldquo;remove&rdquo; and we&rsquo;ll take care of it.
      </Shell>
    );
  }

  // Confirm step — reached by clicking the footer link (a GET). Nothing has
  // been unsubscribed yet; that only happens when the button below is clicked.
  const email = t ? readUnsubToken(t) : null;
  if (t && email) {
    // Real browsers auto-complete the opt-out on load (see AutoUnsubscribe);
    // no-JS clients get the manual button. Scanners run neither, so they can't
    // opt anyone out.
    return (
      <section className="wrap page-head" style={{ paddingBottom: 100 }}>
        <AutoUnsubscribe token={t} email={email} />
        <noscript>
          <form action="/api/unsubscribe" method="post" style={{ marginTop: 20 }}>
            <input type="hidden" name="t" value={t} />
            <button className="btn btn--primary" type="submit">
              Unsubscribe
            </button>
          </form>
        </noscript>
      </section>
    );
  }

  return (
    <Shell label="Invalid link" heading="This link is invalid or expired.">
      Reply to the email with &ldquo;remove&rdquo; and we&rsquo;ll take care of it.
    </Shell>
  );
}

function Shell({
  label,
  heading,
  children,
}: {
  label: string;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="wrap page-head" style={{ paddingBottom: 100 }}>
      <span className="eyebrow">
        <span className="label label--accent">{label}</span>
      </span>
      <h1>{heading}</h1>
      <p className="lede" style={{ marginBottom: 26 }}>
        {children}
      </p>
      <div className="hero-cta">
        <Link className="btn btn--primary" href="/directory">
          Browse the directory
        </Link>
      </div>
    </section>
  );
}
