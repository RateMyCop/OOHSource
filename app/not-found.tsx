import Link from "next/link";

export default function NotFound() {
  return (
    <section className="wrap page-head" style={{ paddingBottom: 100 }}>
      <span className="eyebrow">
        <span className="label label--accent">404</span>
      </span>
      <h1>That listing isn&rsquo;t here.</h1>
      <p className="lede" style={{ marginBottom: 26 }}>
        The page you&rsquo;re after may have moved. Try the directory instead.
      </p>
      <div className="hero-cta">
        <Link className="btn btn--primary" href="/directory">
          Browse the directory
        </Link>
        <Link className="btn btn--ghost" href="/">
          Back home
        </Link>
      </div>
    </section>
  );
}
