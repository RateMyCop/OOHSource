import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategory } from "@/lib/data";
import { getAllVendors, getVendorBySlug, getVendorsByCategory } from "@/lib/vendors";
import { VendorCard } from "@/components/VendorCard";

export const revalidate = 60;

export async function generateStaticParams() {
  const vendors = await getAllVendors();
  return vendors.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const vendor = await getVendorBySlug(params.slug);
  if (!vendor) return { title: "Not found — OOHsource" };
  return {
    title: `${vendor.name} — ${vendor.subcategory} | OOHsource`,
    description: vendor.description,
  };
}

export default async function VendorPage({
  params,
}: {
  params: { slug: string };
}) {
  const vendor = await getVendorBySlug(params.slug);
  if (!vendor) notFound();

  const category = getCategory(vendor.categorySlug);
  const related = (await getVendorsByCategory(vendor.categorySlug))
    .filter((v) => v.slug !== vendor.slug)
    .slice(0, 2);

  return (
    <section className="wrap">
      <div className="page-head" style={{ paddingBottom: 0 }}>
        <div className="crumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/directory">Directory</Link>
          <span>/</span>
          {category && <Link href={`/category/${category.slug}`}>{category.name}</Link>}
        </div>
      </div>

      <div className="detail">
        <div>
          <div className="detail-badges">
            {vendor.tier === "Featured" && (
              <span className="badge badge--featured">Featured</span>
            )}
            {vendor.tier === "Premium" && (
              <span className="badge badge--premium">Premium</span>
            )}
            {vendor.verified && (
              <span className="badge badge--verified">
                <span className="v" />
                Verified
              </span>
            )}
          </div>

          <h1>{vendor.name}</h1>
          <p className="lead">{vendor.description}</p>

          <div className="detail-section">
            <h2>Formats</h2>
            <div className="spec-list">
              {vendor.formats.map((f) => (
                <span key={f} className="tag">
                  {f}
                </span>
              ))}
            </div>
          </div>

          <div className="detail-section">
            <h2>Specialties</h2>
            <div className="spec-list">
              {vendor.specialties.map((s) => (
                <span key={s} className="tag">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {related.length > 0 && (
            <div className="detail-section">
              <h2>More in {category?.name}</h2>
              <div className="vgrid" style={{ marginTop: 6 }}>
                {related.map((v) => (
                  <VendorCard key={v.slug} vendor={v} />
                ))}
              </div>
            </div>
          )}
        </div>

        <aside>
          <div className="aside-card">
            <div className="aside-row">
              <span className="k">Category</span>
              <span className="val">{category?.name}</span>
            </div>
            <div className="aside-row">
              <span className="k">Role</span>
              <span className="val">{vendor.subcategory}</span>
            </div>
            <div className="aside-row">
              <span className="k">Location</span>
              <span className="val">{vendor.location}</span>
            </div>
            {vendor.address && (
              <div className="aside-row">
                <span className="k">Address</span>
                <span className="val">{vendor.address}</span>
              </div>
            )}
            <div className="aside-row">
              <span className="k">Coverage</span>
              <span className="val">{vendor.coverage}</span>
            </div>
            {vendor.phone && (
              <div className="aside-row">
                <span className="k">Phone</span>
                <a className="val" href={`tel:${vendor.phone}`}>
                  {vendor.phone}
                </a>
              </div>
            )}
            <a
              className="btn btn--primary"
              href={vendor.website}
              target="_blank"
              rel="noopener noreferrer nofollow"
            >
              Visit website →
            </a>
            <Link className="btn btn--ghost" href="/list-your-company">
              Claim this listing
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
