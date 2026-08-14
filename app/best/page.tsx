import type { Metadata } from "next";
import Link from "next/link";
import { getCategory } from "@/lib/data";
import { LISTS, SITE_URL } from "@/lib/lists";
import { JsonLd } from "@/components/JsonLd";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Best of Out-of-Home — Top 10 Rankings",
  description:
    "Curated Top 10 rankings of the best out-of-home advertising companies — media owners, printers, agencies, DOOH ad-tech, and installers.",
  alternates: { canonical: `${SITE_URL}/best` },
};

export default function BestIndexPage() {
  const collection = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Best of Out-of-Home — Top 10 Rankings",
    url: `${SITE_URL}/best`,
    hasPart: LISTS.map((l) => ({
      "@type": "ItemList",
      name: l.title,
      url: `${SITE_URL}/best/${l.slug}`,
    })),
  };

  return (
    <section className="wrap">
      <JsonLd data={collection} />
      <div className="page-head">
        <div className="crumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span>Best of</span>
        </div>
        <h1>Best of Out-of-Home</h1>
        <p className="lede">
          Curated Top 10 rankings across the out-of-home industry — ordered by
          verified customer ratings and market coverage, never by who pays.
        </p>
        <p className="hub-copy">
          Out-of-home advertising — billboards, digital screens, transit, street
          furniture, and place-based media — is one of the few channels that
          can&rsquo;t be skipped, blocked, or scrolled past. These lists surface the
          strongest operators in each corner of the industry, scored on verified
          customer reviews and the breadth of markets they cover, so buyers can
          shortlist with confidence instead of guesswork. Rankings refresh as new
          companies are added and reviewed.
        </p>
      </div>

      <div className="vgrid" style={{ paddingBottom: 80 }}>
        {LISTS.map((l) => {
          const category = getCategory(l.category);
          return (
            <Link key={l.slug} href={`/best/${l.slug}`} className="vcard">
              <div className="vcard-top">
                <div>
                  <h3>{l.title}</h3>
                  <div className="vsub">{category?.name}</div>
                </div>
              </div>
              <p>{l.metaDescription}</p>
              <div className="vcard-meta">
                <span className="label label--accent">View ranking →</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
