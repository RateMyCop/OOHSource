import type { Metadata } from "next";
import Link from "next/link";
import { vendorCategories, sortByTier, VENDOR_CATEGORY_SLUGS } from "@/lib/data";
import { getVendorsInCategories } from "@/lib/vendors";
import { VendorCard } from "@/components/VendorCard";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "OOH Vendors — Media Owners, Printers, Installers & Tech",
  description:
    "The out-of-home supply chain: media owners, large-format printers, installers, DOOH technology, and creative studios. Browse and shortlist vetted vendors.",
};

export default async function VendorsHub() {
  const cats = vendorCategories();
  const featured = sortByTier(
    await getVendorsInCategories(VENDOR_CATEGORY_SLUGS)
  ).slice(0, 6);

  return (
    <section className="wrap">
      <div className="page-head">
        <div className="crumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span>Vendors</span>
        </div>
        <span className="eyebrow">
          <span className="label label--accent">The supply side</span>
        </span>
        <h1>The out-of-home supply chain.</h1>
        <p className="lede">
          Everyone who builds, prints, installs, powers, and sells out-of-home —
          the companies that put brands on the street. Browse by what you need.
        </p>
      </div>

      <div className="ruled cols-3" style={{ marginBottom: 56 }}>
        {cats.map((c) => (
          <Link key={c.slug} className="cat" href={`/category/${c.slug}`}>
            <h3>{c.name}</h3>
            <ul>
              {c.subcategories.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <span className="cat-link">Browse →</span>
          </Link>
        ))}
      </div>

      <div style={{ paddingBottom: 80 }}>
        <div className="results-top">
          <span className="results-count">Featured vendors</span>
          <Link
            href="/directory"
            className="label label--accent"
            style={{ textDecoration: "none" }}
          >
            View full directory →
          </Link>
        </div>
        <div className="vgrid">
          {featured.map((v) => (
            <VendorCard key={v.slug} vendor={v} />
          ))}
        </div>
      </div>
    </section>
  );
}
