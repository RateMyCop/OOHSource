import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

export default function UnsubscribePage({
  searchParams,
}: {
  searchParams: { ok?: string };
}) {
  const ok = searchParams.ok !== "0";
  return (
    <section className="wrap page-head" style={{ paddingBottom: 100 }}>
      <span className="eyebrow">
        <span className="label label--accent">{ok ? "Unsubscribed" : "Invalid link"}</span>
      </span>
      <h1>{ok ? "You're unsubscribed." : "This link didn't work."}</h1>
      <p className="lede" style={{ marginBottom: 26 }}>
        {ok
          ? "You won't receive any more outreach emails from OOHsource. Your directory listing stays live — you can still claim or update it anytime."
          : "We couldn't process that unsubscribe link. Reply to the email with “remove” and we'll take care of it."}
      </p>
      <div className="hero-cta">
        <Link className="btn btn--primary" href="/directory">
          Browse the directory
        </Link>
      </div>
    </section>
  );
}
