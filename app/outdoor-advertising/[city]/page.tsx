import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllVendors } from "@/lib/vendors";
import { SITE_URL } from "@/lib/lists";
import { CITIES, getCity, vendorsForCity } from "@/lib/cities";
import { VendorLogo } from "@/components/VendorLogo";
import { JsonLd } from "@/components/JsonLd";

export const revalidate = 60;

export function generateStaticParams() {
  return CITIES.map((c) => ({ city: c.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { city: string };
}): Metadata {
  const c = getCity(params.city);
  if (!c) return { title: "Not found" };
  const title = `Outdoor Advertising in ${c.name}, ${c.state} — Billboards & DOOH`;
  const description = `Find outdoor advertising companies serving ${c.name}, ${c.stateName} — billboard, transit, and DOOH media owners, printers and agencies. Compare coverage and formats, free.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/outdoor-advertising/${c.slug}` },
    openGraph: { type: "website", title, description },
  };
}

function snippet(text: string, words: number): string {
  const w = (text || "").trim().split(/\s+/);
  if (w.length <= words) return text;
  return w.slice(0, words).join(" ").replace(/[.,;:]$/, "") + "…";
}

export default async function CityPage({
  params,
}: {
  params: { city: string };
}) {
  const c = getCity(params.city);
  if (!c) notFound();

  const vendors = vendorsForCity(await getAllVendors(), c);
  const h1 = `Outdoor Advertising in ${c.name}, ${c.state}`;

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: h1,
    numberOfItems: vendors.length,
    itemListElement: vendors.map((v, i) => ({
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
      {
        "@type": "ListItem",
        position: 2,
        name: "Outdoor Advertising by City",
        item: `${SITE_URL}/outdoor-advertising`,
      },
      { "@type": "ListItem", position: 3, name: h1 },
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
          <Link href="/outdoor-advertising">Outdoor Advertising by City</Link>
          <span>/</span>
          <span>{c.name}</span>
        </div>
        <h1>{h1}</h1>
        <p className="lede">{c.intro}</p>
      </div>

      <ol className="ranklist">
        {vendors.map((v, i) => {
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
                <p className="rank-desc">{snippet(v.description, 36)}</p>
              </Link>
            </li>
          );
        })}
      </ol>

      <div className="list-cta">
        <p>
          Run out-of-home media in {c.name} or the {c.region}? Get listed free so
          the brands and agencies planning campaigns here can find you.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link className="btn btn--primary" href="/list-your-company">
            List your company
          </Link>
          <Link className="btn" href="/directory">
            Browse the full directory →
          </Link>
        </div>
      </div>
    </section>
  );
}
