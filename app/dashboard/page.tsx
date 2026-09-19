import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionEmail } from "@/lib/auth";
import { ownedSlugsForEmail } from "@/lib/owner";
import { getVendorBySlug, getVendorsByCategory } from "@/lib/vendors";
import { getCategory } from "@/lib/data";
import { getStats } from "@/lib/stats";
import { listForCategory, fullRankOfVendor } from "@/lib/lists";
import { Sparkline } from "@/components/Sparkline";
import { ProfileStrength } from "@/components/ProfileStrength";
import { RankBadgeEmbed } from "@/components/RankBadgeEmbed";
import { OwnerReviews, type ORev } from "@/components/OwnerReviews";
import { listReviewsForSlug } from "@/lib/reviews";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Owner dashboard",
  robots: { index: false, follow: false },
};

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

export default async function DashboardPage() {
  const email = getSessionEmail();
  if (!email) redirect("/login");
  const year = new Date().getUTCFullYear();

  let live: {
    slug: string;
    vendor: NonNullable<Awaited<ReturnType<typeof getVendorBySlug>>>;
    stats: Awaited<ReturnType<typeof getStats>>;
    ranking: { listSlug: string; listTitle: string; limit: number; rank: number; total: number; inTop: boolean } | null;
    reviews: ORev[];
  }[] = [];
  let loadError = false;
  try {
    const slugs = await ownedSlugsForEmail(email);
    const items = await Promise.all(
      slugs.map(async (slug) => {
        const [vendor, stats, rawReviews] = await Promise.all([
          getVendorBySlug(slug),
          getStats(slug, 30),
          listReviewsForSlug(slug),
        ]);
        const reviews: ORev[] = rawReviews.map((r) => ({
          id: r.id,
          name: r.name,
          company: r.company,
          rating: r.rating,
          title: r.title,
          body: r.body,
          status: r.status,
          created: r.created,
          response: r.response,
        }));
        let ranking = null as (typeof live)[number]["ranking"];
        if (vendor) {
          const list = listForCategory(vendor.categorySlug);
          if (list) {
            const fr = fullRankOfVendor(await getVendorsByCategory(vendor.categorySlug), slug);
            if (fr) {
              ranking = {
                listSlug: list.slug,
                listTitle: list.title,
                limit: list.limit,
                rank: fr.rank,
                total: fr.total,
                inTop: fr.rank <= list.limit,
              };
            }
          }
        }
        return { slug, vendor, stats, ranking, reviews };
      })
    );
    live = items.filter((it): it is (typeof live)[number] => Boolean(it.vendor));
  } catch (e) {
    console.error("[dashboard] load failed:", e);
    loadError = true;
  }

  return (
    <section className="dash-page">
      <div className="dash-head">
        <div>
          <h1 style={{ marginBottom: 6 }}>Your dashboard.</h1>
          <p className="hint" style={{ margin: 0 }}>Signed in as {email}</p>
        </div>
      </div>

      {loadError ? (
        <div className="aside-card" style={{ marginTop: 28, maxWidth: 560 }}>
          <p style={{ margin: 0 }}>Couldn&rsquo;t load your dashboard just now.</p>
          <p className="hint" style={{ margin: 0 }}>
            This is usually a momentary hiccup — please refresh. If it keeps
            happening, let us know.
          </p>
          <a className="btn btn--primary btn--sm" href="/dashboard" style={{ alignSelf: "flex-start" }}>Refresh</a>
        </div>
      ) : live.length === 0 ? (
        <div className="aside-card" style={{ marginTop: 28, maxWidth: 560 }}>
          <p style={{ margin: 0 }}>No confirmed listings are linked to <strong>{email}</strong> yet.</p>
          <p className="hint" style={{ margin: 0 }}>
            Find your company in the <Link href="/directory">directory</Link> and
            click &ldquo;Claim this listing.&rdquo; Once your claim email is
            confirmed and matches your company domain, it&rsquo;ll show up here.
          </p>
        </div>
      ) : (
        <div className="dash-grid">
          {live.map(({ slug, vendor, stats, ranking, reviews }) => {
            const v30 = sum(stats.series.view);
            const w30 = sum(stats.series.website);
            const e30 = sum(stats.series.email);
            const catName = getCategory(vendor.categorySlug)?.name || "your category";
            return (
              <article key={slug} className="dash-card">
                <div className="dash-card-head">
                  <div>
                    <h2 style={{ margin: 0 }}>{vendor.name}</h2>
                    <span className="hint">{vendor.location}</span>
                  </div>
                  <div className="detail-badges" style={{ margin: 0 }}>
                    {vendor.tier === "Featured" ? (
                      <span className="badge badge--featured">Featured</span>
                    ) : null}
                  </div>
                </div>

                {/* 1 — Profile strength */}
                <ProfileStrength vendor={vendor} slug={slug} />

                {/* 2 — Rankings & awards */}
                <div id="rankings" className="dash-section">
                  <h3 className="dash-section-h">Rankings &amp; awards</h3>
                  {ranking ? (
                    ranking.inTop ? (
                      <>
                        <p className="dash-rank-line">
                          You rank <strong className="dash-rank-num">#{ranking.rank}</strong> in{" "}
                          <Link href={`/best/${ranking.listSlug}`}>{ranking.listTitle}</Link>
                          {" "}— top {ranking.limit} of {ranking.total} in {catName}.
                        </p>
                        <RankBadgeEmbed
                          slug={slug}
                          name={vendor.name}
                          listSlug={ranking.listSlug}
                          listTitle={ranking.listTitle}
                          rank={ranking.rank}
                          year={year}
                        />
                      </>
                    ) : (
                      <p className="dash-rank-line">
                        You&rsquo;re <strong className="dash-rank-num">#{ranking.rank}</strong> of {ranking.total} in {catName}.
                        Reach the <Link href={`/best/${ranking.listSlug}`}>Top {ranking.limit}</Link> to unlock an
                        embeddable award badge — climb by earning more verified reviews and widening your market coverage.
                      </p>
                    )
                  ) : (
                    <p className="hint">No ranking list for this category yet.</p>
                  )}
                </div>

                {/* 3 — Data-driven Featured upsell */}
                {vendor.tier !== "Featured" && ranking && (
                  <div className="dash-upsell">
                    <div>
                      <strong>Move to the top.</strong> You&rsquo;re #{ranking.rank} of {ranking.total} in {catName}.
                      Featured pins you above{" "}
                      {ranking.rank > 1 ? `the ${ranking.rank - 1} ${ranking.rank - 1 === 1 ? "company" : "companies"} ranked above you` : "every standard listing"}
                      {" "}— top of the category and search results, plus the Featured &amp; Verified badges.
                    </div>
                    <Link className="btn btn--primary btn--sm" href="/pricing">Get Featured →</Link>
                  </div>
                )}

                {/* Engagement */}
                <div id="engagement" className="dash-section">
                  <h3 className="dash-section-h">Engagement · 30 days</h3>
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
                </div>

                {/* Reviews */}
                <div id="reviews" className="dash-section">
                  <h3 className="dash-section-h">
                    Reviews
                    {reviews.filter((r) => r.status === "published").length > 0 &&
                      ` · ${reviews.filter((r) => r.status === "published").length} published`}
                    {reviews.filter((r) => r.status === "pending").length > 0 &&
                      ` · ${reviews.filter((r) => r.status === "pending").length} pending`}
                  </h3>
                  <OwnerReviews slug={slug} reviews={reviews} />
                </div>

                <div className="dash-card-foot">
                  <Link className="btn btn--primary btn--sm" href={`/dashboard/${slug}#editor`}>Edit listing</Link>
                  <Link className="btn btn--ghost btn--sm" href={`/directory/${slug}`}>View</Link>
                  {vendor.tier !== "Featured" && (
                    <Link className="btn btn--ghost btn--sm" href="/pricing">Get Featured →</Link>
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
