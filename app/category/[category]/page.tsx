import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORIES, getCategory } from "@/lib/data";
import { getVendorsByCategory } from "@/lib/vendors";
import { CategorySlug } from "@/lib/types";
import { VendorCard } from "@/components/VendorCard";
import { listForCategory, vendorScore, SITE_URL } from "@/lib/lists";

export const revalidate = 60;

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { category: string };
}): Metadata {
  const category = getCategory(params.category as CategorySlug);
  if (!category) return { title: "Not found" };
  return {
    title: category.name,
    description: `Browse ${category.name.toLowerCase()} in the global out-of-home directory. ${category.blurb}`,
    alternates: { canonical: `${SITE_URL}/category/${category.slug}` },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: { category: string };
}) {
  const category = getCategory(params.category as CategorySlug);
  if (!category) notFound();

  // Ranked leaderboard order: Featured placements first (the pay-to-play model),
  // then by the transparent rating-weighted score, then name. This makes the
  // rank numbers on the cards meaningful rather than merely alphabetical.
  const TIER_RANK: Record<string, number> = { Featured: 0, Free: 1 };
  const vendors = [...(await getVendorsByCategory(category.slug))].sort(
    (a, b) =>
      TIER_RANK[a.tier] - TIER_RANK[b.tier] ||
      vendorScore(b) - vendorScore(a) ||
      a.name.localeCompare(b.name)
  );
  const list = listForCategory(category.slug);

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
        {list && (
          <Link href={`/best/${list.slug}`} className="cat-toplink">
            🏆 {list.title} →
          </Link>
        )}
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
            {vendors.map((v, i) => (
              <VendorCard key={v.slug} vendor={v} rank={i + 1} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
