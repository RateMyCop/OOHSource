import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionEmail } from "@/lib/auth";
import { ownedSlugsForEmail } from "@/lib/owner";
import { getVendorBySlug } from "@/lib/vendors";
import { getStats } from "@/lib/stats";
import { ListingEditor } from "@/components/ListingEditor";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manage listing",
  robots: { index: false, follow: false },
};

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

export default async function ManageListingPage({
  params,
}: {
  params: { slug: string };
}) {
  const email = getSessionEmail();
  if (!email) redirect("/login");

  const owned = await ownedSlugsForEmail(email);
  if (!owned.includes(params.slug)) redirect("/dashboard");

  const vendor = await getVendorBySlug(params.slug);
  if (!vendor) notFound();
  const stats = await getStats(params.slug, 30);

  return (
    <section className="wrap page-head" style={{ paddingBottom: 90 }}>
      <div className="crumb">
        <Link href="/dashboard">Dashboard</Link>
        <span>/</span>
        <span>{vendor.name}</span>
      </div>

      <div className="dash-head">
        <div>
          <h1 style={{ marginBottom: 6 }}>{vendor.name}</h1>
          <p className="hint" style={{ margin: 0 }}>
            Manage your listing details and see recent activity.
          </p>
        </div>
        <Link className="btn btn--ghost btn--sm" href={`/directory/${vendor.slug}`}>
          View public listing →
        </Link>
      </div>

      <div className="stat-tiles" style={{ maxWidth: 520, marginTop: 24 }}>
        <div className="stat-tile">
          <span className="stat-num">{sum(stats.series.view)}</span>
          <span className="stat-label">Views · 30d</span>
          <span className="stat-sub">{stats.totals.view} all-time</span>
        </div>
        <div className="stat-tile">
          <span className="stat-num">{sum(stats.series.website)}</span>
          <span className="stat-label">Website clicks · 30d</span>
          <span className="stat-sub">{stats.totals.website} all-time</span>
        </div>
        <div className="stat-tile">
          <span className="stat-num">{sum(stats.series.email)}</span>
          <span className="stat-label">Email clicks · 30d</span>
          <span className="stat-sub">{stats.totals.email} all-time</span>
        </div>
      </div>

      <div style={{ marginTop: 36 }}>
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
    </section>
  );
}
