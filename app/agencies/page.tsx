import type { Metadata } from "next";
import Link from "next/link";
import { agencyCategories, sortByTier, AGENCY_CATEGORY_SLUGS } from "@/lib/data";
import { getVendorsInCategories } from "@/lib/vendors";
import { SITE_URL } from "@/lib/lists";
import { VendorCard } from "@/components/VendorCard";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "OOH Agencies & Media Buyers",
  description:
    "The specialists who plan and buy out-of-home on behalf of brands — OOH agencies, media planning & buying, and programmatic DOOH partners.",
  alternates: { canonical: `${SITE_URL}/agencies` },
};

export default async function AgenciesHub() {
  const agencies = sortByTier(
    await getVendorsInCategories(AGENCY_CATEGORY_SLUGS)
  );
  const subcats = agencyCategories().flatMap((c) => c.subcategories);

  return (
    <section className="wrap">
      <div className="page-head">
        <div className="crumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span>Agencies</span>
        </div>
        <span className="eyebrow">
          <span className="label label--accent">The demand side</span>
        </span>
        <h1>Agencies &amp; buyers.</h1>
        <p className="lede">
          The specialists who plan and buy out-of-home on behalf of brands — find
          a partner to run your campaign end to end.
        </p>
        <div className="formats" style={{ marginTop: 20 }}>
          <span className="lab">Includes</span>
          {subcats.map((s) => (
            <span key={s} className="fmt">
              {s}
            </span>
          ))}
        </div>
      </div>

      <div style={{ paddingBottom: 80 }}>
        <div className="results-top">
          <span className="results-count">
            {agencies.length} {agencies.length === 1 ? "agency" : "agencies"}
          </span>
          <Link
            href="/category/agencies-buyers"
            className="label label--accent"
            style={{ textDecoration: "none" }}
          >
            See all agencies →
          </Link>
        </div>
        {agencies.length === 0 ? (
          <div className="empty">
            No agencies listed yet.{" "}
            <a href="/list-your-company" style={{ color: "var(--accent-strong)" }}>
              Add one.
            </a>
          </div>
        ) : (
          <div className="vgrid">
            {agencies.map((v) => (
              <VendorCard key={v.slug} vendor={v} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
