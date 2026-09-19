import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionEmail } from "@/lib/auth";
import { ownedSlugsForEmail } from "@/lib/owner";
import { getVendorBySlug, getVendorsByCategory } from "@/lib/vendors";
import { getCategory } from "@/lib/data";
import { getStats } from "@/lib/stats";
import { listForCategory, fullRankOfVendor } from "@/lib/lists";
import { listReviewsForSlug } from "@/lib/reviews";
import { readAiVis, readAiVisHistory, vendorAiVis } from "@/lib/aivis";
import { Sparkline } from "@/components/Sparkline";
import { ProfileStrength } from "@/components/ProfileStrength";
import { RankBadgeEmbed } from "@/components/RankBadgeEmbed";
import { BadgeEmbed } from "@/components/BadgeEmbed";
import { OwnerReviews, type ORev } from "@/components/OwnerReviews";
import { OwnerLeads, type OLead } from "@/components/OwnerLeads";
import { listLeadsForSlug } from "@/lib/leads";
import { ListingEditor } from "@/components/ListingEditor";
import { Analytics } from "@/components/Analytics";
import { AiVisibility } from "@/components/AiVisibility";
import { PlanCompare } from "@/components/PlanCompare";
import { FeatureButton } from "@/components/FeatureButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Owner dashboard",
  robots: { index: false, follow: false },
};

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

const TABS: Record<string, string> = {
  overview: "Dashboard",
  edit: "Edit profile",
  rankings: "Rankings & awards",
  reviews: "Reviews",
  packages: "Packages",
  analytics: "Performance analytics",
  leads: "Leads",
  aivis: "AI visibility",
  engagement: "Engagement",
};

function toORev(rows: Awaited<ReturnType<typeof listReviewsForSlug>>): ORev[] {
  return rows.map((r) => ({
    id: r.id, name: r.name, company: r.company, rating: r.rating,
    title: r.title, body: r.body, status: r.status, created: r.created, response: r.response,
  }));
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { tab?: string; slug?: string };
}) {
  const email = getSessionEmail();
  if (!email) redirect("/login");

  const tab = searchParams?.tab && TABS[searchParams.tab] ? searchParams.tab : "overview";

  let slugs: string[] = [];
  let loadError = false;
  try {
    slugs = await ownedSlugsForEmail(email);
  } catch {
    loadError = true;
  }

  if (loadError) {
    return (
      <section className="dash-page">
        <div className="aside-card" style={{ maxWidth: 560 }}>
          <p style={{ margin: 0 }}>Couldn&rsquo;t load your dashboard just now.</p>
          <a className="btn btn--primary btn--sm" href="/dashboard" style={{ alignSelf: "flex-start" }}>Refresh</a>
        </div>
      </section>
    );
  }

  if (slugs.length === 0) {
    return (
      <section className="dash-page">
        <div className="dash-head"><h1>Your dashboard.</h1></div>
        <div className="aside-card" style={{ marginTop: 24, maxWidth: 560 }}>
          <p style={{ margin: 0 }}>No confirmed listings are linked to <strong>{email}</strong> yet.</p>
          <p className="hint" style={{ margin: 0 }}>
            Find your company in the <Link href="/directory">directory</Link> and click
            &ldquo;Claim this listing.&rdquo;
          </p>
        </div>
      </section>
    );
  }

  const activeSlug = searchParams?.slug && slugs.includes(searchParams.slug) ? searchParams.slug : slugs[0];
  const vendor = await getVendorBySlug(activeSlug);
  if (!vendor) redirect("/dashboard");

  const withSlug = (t: string) => `/dashboard?tab=${t}${slugs.length > 1 ? `&slug=${activeSlug}` : ""}`;

  return (
    <section className="dash-page">
      <div className="dash-head">
        <div>
          <h1 style={{ marginBottom: 6 }}>{TABS[tab]}</h1>
          <p className="hint" style={{ margin: 0 }}>{vendor.name} · signed in as {email}</p>
        </div>
      </div>

      {slugs.length > 1 && tab !== "overview" && (
        <div className="dash-switcher">
          {await Promise.all(
            slugs.map(async (s) => {
              const v = await getVendorBySlug(s);
              return (
                <Link key={s} href={`/dashboard?tab=${tab}&slug=${s}`} className={`dash-switch${s === activeSlug ? " is-active" : ""}`}>
                  {v?.name || s}
                </Link>
              );
            })
          )}
        </div>
      )}

      {tab === "overview" && <OverviewPanel slugs={slugs} />}

      {tab === "edit" && (
        <div className="dash-panel">
          <ListingEditor
            slug={vendor.slug}
            website={vendor.website || ""}
            phone={vendor.phone || ""}
            address={vendor.address || ""}
            description={vendor.description || ""}
            heroImage={vendor.heroImage || ""}
            gallery={vendor.gallery || []}
          />
        </div>
      )}

      {tab === "rankings" && (
        <div className="dash-panel">
          <RankingsPanel slug={activeSlug} />
        </div>
      )}

      {tab === "reviews" && (
        <div className="dash-panel">
          <OwnerReviews slug={activeSlug} reviews={toORev(await listReviewsForSlug(activeSlug))} />
        </div>
      )}

      {tab === "packages" && (
        <div className="dash-panel">
          <PackagesPanel slug={activeSlug} />
        </div>
      )}

      {tab === "leads" && (
        <div className="dash-panel">
          <OwnerLeads
            leads={(await listLeadsForSlug(activeSlug)).map((l): OLead => ({
              id: l.id, name: l.name, email: l.email, company: l.company,
              message: l.message, created: l.created, read: l.read,
            }))}
          />
        </div>
      )}

      {tab === "analytics" && (
        <div className="dash-panel">
          {await (async () => {
            const stats = await getStats(activeSlug, 90);
            return <Analytics dates={stats.dates} series={stats.series} totalsAllTime={stats.totals} />;
          })()}
        </div>
      )}

      {tab === "aivis" && (
        <div className="dash-panel">
          {await (async () => {
            const [aiv, hist] = await Promise.all([readAiVis(), readAiVisHistory()]);
            return <AiVisibility vendor={vendor} data={vendorAiVis(vendor, aiv, hist)} />;
          })()}
        </div>
      )}

      {tab === "engagement" && (
        <div className="dash-panel">
          {await (async () => {
            const stats = await getStats(activeSlug, 30);
            return (
              <>
                <div className="stat-tiles">
                  <div className="stat-tile"><span className="stat-num">{sum(stats.series.view)}</span><span className="stat-label">Views · 30d</span><span className="stat-sub">{stats.totals.view} all-time</span></div>
                  <div className="stat-tile"><span className="stat-num">{sum(stats.series.website)}</span><span className="stat-label">Website clicks · 30d</span><span className="stat-sub">{stats.totals.website} all-time</span></div>
                  <div className="stat-tile"><span className="stat-num">{sum(stats.series.email)}</span><span className="stat-label">Email clicks · 30d</span><span className="stat-sub">{stats.totals.email} all-time</span></div>
                </div>
                <div className="dash-spark" style={{ marginTop: 18 }}>
                  <span className="stat-label">Views · last 30 days</span>
                  <Sparkline data={stats.series.view} />
                </div>
              </>
            );
          })()}
        </div>
      )}

      {tab === "edit" && null}
    </section>
  );
}

// ---- Panels ----

async function OverviewPanel({ slugs }: { slugs: string[] }) {
  const cards = await Promise.all(
    slugs.map(async (slug) => {
      const [vendor, stats] = await Promise.all([getVendorBySlug(slug), getStats(slug, 30)]);
      if (!vendor) return null;
      const list = listForCategory(vendor.categorySlug);
      const fr = list ? fullRankOfVendor(await getVendorsByCategory(vendor.categorySlug), slug) : null;
      const catName = getCategory(vendor.categorySlug)?.name || "your category";
      return { slug, vendor, stats, fr, list, catName };
    })
  );
  return (
    <div className="dash-grid">
      {cards.filter(Boolean).map((c) => {
        const { slug, vendor, stats, fr, catName } = c!;
        return (
          <article key={slug} className="dash-card">
            <div className="dash-card-head">
              <div><h2 style={{ margin: 0 }}>{vendor.name}</h2><span className="hint">{vendor.location}</span></div>
              {vendor.tier === "Featured" && <span className="badge badge--featured">Featured</span>}
            </div>
            <ProfileStrength vendor={vendor} slug={slug} />
            <div className="stat-tiles">
              <div className="stat-tile"><span className="stat-num">{sum(stats.series.view)}</span><span className="stat-label">Views · 30d</span></div>
              <div className="stat-tile"><span className="stat-num">{sum(stats.series.website) + sum(stats.series.email)}</span><span className="stat-label">Clicks · 30d</span></div>
              <div className="stat-tile"><span className="stat-num">{fr ? `#${fr.rank}` : "—"}</span><span className="stat-label">Rank in {catName}</span></div>
            </div>
            <div className="dash-card-foot">
              <Link className="btn btn--primary btn--sm" href={`/dashboard?tab=edit&slug=${slug}`}>Edit profile</Link>
              <Link className="btn btn--ghost btn--sm" href={`/dashboard?tab=reviews&slug=${slug}`}>Reviews</Link>
              <Link className="btn btn--ghost btn--sm" href={`/directory/${slug}`}>View</Link>
            </div>
          </article>
        );
      })}
      <p className="hint" style={{ gridColumn: "1 / -1", margin: "4px 0 0" }}>
        Use the tabs on the left to edit your profile, manage reviews, see rankings and analytics.
      </p>
    </div>
  );
}

function bestRating(v: { googleRating?: number; yelpRating?: number; facebookRating?: number }) {
  return v.googleRating ?? v.yelpRating ?? v.facebookRating;
}
function bestReviews(v: { googleRating?: number; googleReviews?: number; yelpRating?: number; yelpReviews?: number; facebookRating?: number; facebookReviews?: number }) {
  if (v.googleRating != null) return v.googleReviews ?? 0;
  if (v.yelpRating != null) return v.yelpReviews ?? 0;
  if (v.facebookRating != null) return v.facebookReviews ?? 0;
  return 0;
}

async function RankingsPanel({ slug }: { slug: string }) {
  const vendor = await getVendorBySlug(slug);
  if (!vendor) return null;
  const list = listForCategory(vendor.categorySlug);
  const catName = getCategory(vendor.categorySlug)?.name || "your category";
  const cat = list ? await getVendorsByCategory(vendor.categorySlug) : [];
  const fr = list && cat.length ? fullRankOfVendor(cat, slug) : null;
  const year = new Date().getUTCFullYear();

  // Category benchmark (uses ratings we already have).
  const rated = cat.map(bestRating).filter((n): n is number => typeof n === "number");
  const avgRating = rated.length ? rated.reduce((a, b) => a + b, 0) / rated.length : 0;
  const revs = cat.map(bestReviews);
  const avgReviews = revs.length ? revs.reduce((a, b) => a + b, 0) / revs.length : 0;
  const myRating = bestRating(vendor);
  const myReviews = bestReviews(vendor);
  const pctTop = fr ? Math.max(1, Math.round((fr.rank / fr.total) * 100)) : 100;
  if (!list || !fr) {
    return (
      <>
        <p className="hint">No ranking list for this category yet.</p>
        <div className="dash-section" style={{ marginTop: 20 }}>
          <h3 className="dash-section-h">Show you&rsquo;re listed</h3>
          <p className="badge-embed-intro">
            Add a free OOHsource badge to your website — it links back to your profile.
          </p>
          <BadgeEmbed slug={slug} name={vendor.name} />
        </div>
      </>
    );
  }
  const inTop = fr.rank <= list.limit;
  return (
    <>
      {inTop ? (
        <>
          <p className="dash-rank-line">
            You rank <strong className="dash-rank-num">#{fr.rank}</strong> in{" "}
            <Link href={`/best/${list.slug}`}>{list.title}</Link> — top {list.limit} of {fr.total} in {catName}.
          </p>
          <RankBadgeEmbed slug={slug} name={vendor.name} listSlug={list.slug} listTitle={list.title} rank={fr.rank} year={year} />
        </>
      ) : (
        <p className="dash-rank-line">
          You&rsquo;re <strong className="dash-rank-num">#{fr.rank}</strong> of {fr.total} in {catName}. Reach the{" "}
          <Link href={`/best/${list.slug}`}>Top {list.limit}</Link> to unlock an embeddable award badge — climb by
          earning more verified reviews and widening your market coverage.
        </p>
      )}
      {vendor.tier !== "Featured" && (
        <div className="dash-upsell" style={{ marginTop: 18 }}>
          <div>
            <strong>Move to the top.</strong> You&rsquo;re #{fr.rank} of {fr.total} in {catName}. Featured pins you
            above every standard listing — top of the category and search, plus the Featured &amp; Verified badges.
          </div>
          <Link className="btn btn--primary btn--sm" href={`/dashboard?tab=packages&slug=${slug}`}>See Packages →</Link>
        </div>
      )}

      <div className="dash-section" style={{ marginTop: 26 }}>
        <h3 className="dash-section-h">How you compare</h3>
        <div className="bench">
          <div className="bench-row">
            <span className="bench-lab">Category rank</span>
            <span className="bench-you">#{fr.rank}<small> of {fr.total}</small></span>
            <span className="bench-vs">top {pctTop}% of {catName}</span>
          </div>
          <div className="bench-row">
            <span className="bench-lab">Average rating</span>
            <span className="bench-you">{myRating != null ? myRating.toFixed(1) : "—"}</span>
            <span className="bench-vs">category avg {avgRating.toFixed(1)}{myRating != null && myRating >= avgRating ? " · above average ▲" : ""}</span>
          </div>
          <div className="bench-row">
            <span className="bench-lab">Reviews</span>
            <span className="bench-you">{myReviews}</span>
            <span className="bench-vs">category avg {Math.round(avgReviews)}{myReviews >= avgReviews ? " · above average ▲" : ""}</span>
          </div>
        </div>
      </div>

      <div className="dash-section" style={{ marginTop: 26 }}>
        <h3 className="dash-section-h">Show you&rsquo;re listed</h3>
        <p className="badge-embed-intro">
          Add a free OOHsource badge to your website — it links back to your profile.
        </p>
        <BadgeEmbed slug={slug} name={vendor.name} />
      </div>
    </>
  );
}

async function PackagesPanel({ slug }: { slug: string }) {
  const vendor = await getVendorBySlug(slug);
  if (!vendor) return null;
  const list = listForCategory(vendor.categorySlug);
  const catName = getCategory(vendor.categorySlug)?.name || "your category";
  const fr = list ? fullRankOfVendor(await getVendorsByCategory(vendor.categorySlug), slug) : null;
  const isFeatured = vendor.tier === "Featured";

  return (
    <>
      {isFeatured ? (
        <div className="pkg-status">
          <strong>★ You&rsquo;re Featured.</strong> Your listing sits at the top of {catName} and search results,
          with the Featured &amp; Verified badges and homepage spotlight. Thanks for supporting OOHsource.
        </div>
      ) : (
        <div className="dash-upsell" style={{ marginBottom: 24 }}>
          <div>
            <strong>Go Featured — $50/yr.</strong>{" "}
            {fr ? `You’re #${fr.rank} of ${fr.total} in ${catName}. ` : ""}
            Featured pins you to the very top of your category and search, adds the Featured &amp; Verified badges,
            and puts you in homepage &amp; &ldquo;Just added&rdquo; spotlights.
          </div>
          <FeatureButton slug={slug} label="★ Get Featured — $50/yr" />
        </div>
      )}
      <PlanCompare />
    </>
  );
}
