import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES } from "@/lib/data";
import { getAllVendors } from "@/lib/vendors";
import { SITE_URL } from "@/lib/lists";
import { JsonLd } from "@/components/JsonLd";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "All Companies — Full Index",
  description:
    "A complete A–Z index of every out-of-home advertising company listed on OOHsource, grouped by role — media owners, agencies, printers, installers, technology, and creative.",
  alternates: { canonical: `${SITE_URL}/companies` },
};

export default async function CompaniesIndexPage() {
  const vendors = await getAllVendors();

  const byCat = CATEGORIES.map((c) => ({
    cat: c,
    items: vendors
      .filter((v) => v.categorySlug === c.slug)
      .sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((g) => g.items.length > 0);

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "All Companies — OOHsource",
    url: `${SITE_URL}/companies`,
    description: `A complete index of ${vendors.length} out-of-home advertising companies.`,
    hasPart: byCat.map((g) => ({
      "@type": "ItemList",
      name: g.cat.name,
      numberOfItems: g.items.length,
    })),
  };

  return (
    <section className="wrap">
      <JsonLd data={collectionLd} />
      <div className="page-head">
        <div className="crumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/directory">Directory</Link>
          <span>/</span>
          <span>All companies</span>
        </div>
        <h1>Every company, in one index.</h1>
        <p className="lede">
          A complete, plain-text index of all {vendors.length.toLocaleString()}{" "}
          out-of-home companies on OOHsource — grouped by what they do, sorted
          A–Z. Looking to filter by format or market instead?{" "}
          <Link href="/directory" style={{ color: "var(--accent-strong)" }}>
            Search the directory
          </Link>
          .
        </p>
      </div>

      <div style={{ paddingBottom: 80 }}>
        {byCat.map((g) => (
          <section key={g.cat.slug} className="index-group">
            <h2 className="index-head">
              <Link href={`/category/${g.cat.slug}`}>{g.cat.name}</Link>
              <span className="index-count">{g.items.length}</span>
            </h2>
            <ul className="index-cols">
              {g.items.map((v) => (
                <li key={v.slug}>
                  <Link href={`/directory/${v.slug}`}>{v.name}</Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}
