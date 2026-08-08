import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORIES, getCategory, vendorsByCategory, sortByTier } from "@/lib/data";
import { CategorySlug } from "@/lib/types";
import { VendorCard } from "@/components/VendorCard";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { category: string };
}): Metadata {
  const category = getCategory(params.category as CategorySlug);
  if (!category) return { title: "Not found — OOHsource" };
  return {
    title: `${category.name} — OOHsource Directory`,
    description: `Browse ${category.name.toLowerCase()} in the global out-of-home directory. ${category.blurb}`,
  };
}

export default function CategoryPage({
  params,
}: {
  params: { category: string };
}) {
  const category = getCategory(params.category as CategorySlug);
  if (!category) notFound();

  const vendors = sortByTier(vendorsByCategory(category.slug));

  return (
    <section className="wrap">
      <div className="page-head">
        <div className="crumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/directory">Directory</Link>
          <span>/</span>
          <span>{category.name}</span>
        </div>
        <h1>{category.name}</h1>
        <p className="lede">{category.blurb}</p>
        <div className="formats" style={{ marginTop: 20 }}>
          <span className="lab">Includes</span>
          {category.subcategories.map((s) => (
            <span key={s} className="fmt">
              {s}
            </span>
          ))}
        </div>
      </div>

      <div style={{ paddingBottom: 80 }}>
        <div className="results-top">
          <span className="results-count">
            {vendors.length} {vendors.length === 1 ? "company" : "companies"}
          </span>
          <Link
            href="/directory"
            className="label label--accent"
            style={{ textDecoration: "none" }}
          >
            View full directory →
          </Link>
        </div>
        {vendors.length === 0 ? (
          <div className="empty">
            No companies listed here yet.{" "}
            <a href="/list-your-company" style={{ color: "var(--accent-strong)" }}>
              Be the first.
            </a>
          </div>
        ) : (
          <div className="vgrid">
            {vendors.map((v) => (
              <VendorCard key={v.slug} vendor={v} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
