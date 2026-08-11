import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionEmail } from "@/lib/auth";
import { ownedSlugsForEmail } from "@/lib/owner";
import { getVendorBySlug } from "@/lib/vendors";
import { getStats } from "@/lib/stats";
import { ListingEditor } from "@/components/ListingEditor";
import { Analytics } from "@/components/Analytics";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manage listing",
  robots: { index: false, follow: false },
};

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
  const stats = await getStats(params.slug, 90);

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

      <div style={{ marginTop: 24 }}>
        <Analytics dates={stats.dates} series={stats.series} totalsAllTime={stats.totals} />
      </div>

      <div style={{ marginTop: 40 }}>
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
