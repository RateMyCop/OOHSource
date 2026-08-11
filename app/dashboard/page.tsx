import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionEmail, isAdmin } from "@/lib/auth";
import { ownedSlugsForEmail } from "@/lib/owner";
import { getVendorBySlug } from "@/lib/vendors";
import { getStats } from "@/lib/stats";
import { Sparkline } from "@/components/Sparkline";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Owner dashboard",
  robots: { index: false, follow: false },
};

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

export default async function DashboardPage() {
  const email = getSessionEmail();
  if (!email) redirect("/login");

  const slugs = await ownedSlugsForEmail(email);
  const items = await Promise.all(
    slugs.map(async (slug) => {
      const [vendor, stats] = await Promise.all([
        getVendorBySlug(slug),
        getStats(slug, 30),
      ]);
      return { slug, vendor, stats };
    })
  );
  const live = items.filter((it) => it.vendor);

  return (
    <section className="wrap page-head" style={{ paddingBottom: 90 }}>
      <div className="dash-head">
        <div>
          <h1 style={{ marginBottom: 6 }}>Your dashboard.</h1>
          <p className="hint" style={{ margin: 0 }}>
            Signed in as {email}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {isAdmin(email) && (
            <Link className="btn btn--ghost btn--sm" href="/admin">
              Admin
            </Link>
          )}
          <form action="/api/auth/logout" method="post">
            <button className="btn btn--ghost btn--sm" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </div>

      {live.length === 0 ? (
        <div className="aside-card" style={{ marginTop: 28, maxWidth: 560 }}>
          <p style={{ margin: 0 }}>
            No confirmed listings are linked to <strong>{email}</strong> yet.
          </p>
          <p className="hint" style={{ margin: 0 }}>
            Find your company in the <Link href="/directory">directory</Link>{" "}
            and click &ldquo;Claim this listing.&rdquo; Once your claim email is
            confirmed and matches your company domain, it&rsquo;ll show up here.
          </p>
        </div>
      ) : (
        <div className="dash-grid">
          {live.map(({ slug, vendor, stats }) => {
            const v30 = sum(stats.series.view);
            const w30 = sum(stats.series.website);
            const e30 = sum(stats.series.email);
            return (
              <article key={slug} className="dash-card">
                <div className="dash-card-head">
                  <div>
                    <h2 style={{ margin: 0 }}>{vendor!.name}</h2>
                    <span className="hint">{vendor!.location}</span>
                  </div>
                  <div className="detail-badges" style={{ margin: 0 }}>
                    {vendor!.tier === "Featured" ? (
                      <span className="badge badge--featured">Featured</span>
                    ) : null}
                  </div>
                </div>

                <div className="stat-tiles">
                  <div className="stat-tile">
                    <span className="stat-num">{v30}</span>
                    <span className="stat-label">Views · 30d</span>
                    <span className="stat-sub">{stats.totals.view} all-time</span>
                  </div>
                  <div className="stat-tile">
                    <span className="stat-num">{w30}</span>
                    <span className="stat-label">Website clicks · 30d</span>
                    <span className="stat-sub">{stats.totals.website} all-time</span>
                  </div>
                  <div className="stat-tile">
                    <span className="stat-num">{e30}</span>
                    <span className="stat-label">Email clicks · 30d</span>
                    <span className="stat-sub">{stats.totals.email} all-time</span>
                  </div>
                </div>

                <div className="dash-spark">
                  <span className="stat-label">Views · last 30 days</span>
                  <Sparkline data={stats.series.view} />
                </div>

                <div className="dash-card-foot">
                  <Link className="btn btn--primary btn--sm" href={`/dashboard/${slug}`}>
                    Edit listing
                  </Link>
                  <Link className="btn btn--ghost btn--sm" href={`/directory/${slug}`}>
                    View
                  </Link>
                  {vendor!.tier !== "Featured" && (
                    <Link className="btn btn--ghost btn--sm" href="/pricing">
                      Get Featured →
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
