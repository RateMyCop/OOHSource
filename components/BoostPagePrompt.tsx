import Link from "next/link";

// Public CTA shown on boostable pages (category + format). Advertises the
// per-page Boost product to any company owner browsing the page and routes
// them to their dashboard, where the actual per-row Boost checkout lives.
// (We can't start checkout from here — a static public page doesn't know which
// listing the viewer owns — so the dashboard is where they pick their row.)
export function BoostPagePrompt({ label }: { label: string }) {
  return (
    <aside className="boost-cta" aria-label="Boost this page">
      <div className="boost-cta-text">
        <span className="boost-cta-eyebrow">Own a company on this page?</span>
        <p className="boost-cta-head">
          Lock the <strong>#1 spot</strong> on {label} — above every listing,
          Featured included.
        </p>
      </div>
      <div className="boost-cta-action">
        <Link href="/dashboard?tab=analytics" className="boost-cta-btn">
          Boost this page →
        </Link>
        <span className="boost-cta-price">$9/mo · cancel anytime</span>
      </div>
    </aside>
  );
}
