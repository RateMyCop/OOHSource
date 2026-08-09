import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategory } from "@/lib/data";
import { getVendorsByCategory } from "@/lib/vendors";
import { LISTS, SITE_URL, getList, rankVendors } from "@/lib/lists";
import { VendorLogo } from "@/components/VendorLogo";
import { JsonLd } from "@/components/JsonLd";

export const revalidate = 60;

export function generateStaticParams() {
  return LISTS.map((l) => ({ slug: l.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const list = getList(params.slug);
  if (!list) return { title: "Not found" };
  return {
    title: list.title,
    description: list.metaDescription,
    alternates: { canonical: `${SITE_URL}/best/${list.slug}` },
  };
}

function snippet(text: string, words: number): string {
  const w = (text || "").trim().split(/\s+/);
  if (w.length <= words) return text;
  return w.slice(0, words).join(" ").replace(/[.,;:]$/, "") + "…";
}

export default async function BestListPage({
  params,
}: {
  params: { slug: string };
}) {
  const list = getList(params.slug);
  if (!list) notFound();

  const category = getCategory(list.category);
  const ranked = rankVendors(await getVendorsByCategory(list.category), list.limit);

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: list.title,
    description: list.metaDescription,
    numberOfItems: ranked.length,
    itemListElement: ranked.map((v, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/directory/${v.slug}`,
      name: v.name,
    })),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Best of", item: `${SITE_URL}/best` },
      { "@type": "ListItem", position: 3, name: list.title },
    ],
  };

  return (
    <section className="wrap">
      <JsonLd data={itemList} />
      <JsonLd data={breadcrumb} />

      <div className="page-head">
        <div className="crumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/best">Best of</Link>
          <span>/</span>
          <span>{list.title}</span>
        </div>
        <h1>{list.title}</h1>
        <p className="lede">{list.intro}</p>
        {category && (
          <div className="results-top" style={{ marginTop: 18 }}>
            <span className="results-count">
              Ranked from {category.name}
            </span>
            <Link
              href={`/category/${category.slug}`}
              className="label label--accent"
              style={{ textDecoration: "none" }}
            >
              See all {category.name} →
            </Link>
          </div>
        )}
      </div>

      <ol className="ranklist">
        {ranked.map((v, i) => {
          const rating = v.googleRating ?? v.yelpRating;
          const reviews = v.googleRating ? v.googleReviews : v.yelpReviews;
          return (
            <li key={v.slug} className="rankrow">
              <span className="rank-num">{i + 1}</span>
              <Link href={`/directory/${v.slug}`} className="rank-body">
                <div className="rank-head">
                  <VendorLogo name={v.name} website={v.website} logo={v.logo} size={40} />
                  <div>
                    <h2 className="rank-name">
                      {v.name}
                      {v.tier === "Featured" && (
                        <span className="badge badge--featured" style={{ marginLeft: 8 }}>
                          Featured
                        </span>
                      )}
                    </h2>
                    <div className="rank-meta">
                      {v.subcategory}
                      {v.location ? ` · ${v.location}` : ""}
                      {rating ? (
                        <span className="rank-rating">
                          <span className="review-star">★</span>
                          {rating.toFixed(1)}
                          {reviews ? ` (${reviews})` : ""}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <p className="rank-desc">{snippet(v.description, 42)}</p>
              </Link>
            </li>
          );
        })}
      </ol>

      <div className="list-method">
        <strong>How this ranking works.</strong> Companies are ordered by a
        transparent blend of verified Google and Yelp ratings (weighted by review
        volume) plus market coverage — not by who pays. Featured listings are
        labeled but are not given an unearned rank. Data is refreshed regularly;
        see each company&rsquo;s profile for current details.
      </div>

      <div className="list-cta">
        <p>Run an out-of-home company? Get listed free, or go Featured for top placement.</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link className="btn btn--primary" href="/list-your-company">
            List your company
          </Link>
          <Link className="btn" href="/pricing">
            See pricing →
          </Link>
        </div>
      </div>
    </section>
  );
}
