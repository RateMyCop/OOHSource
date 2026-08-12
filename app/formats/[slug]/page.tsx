import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllVendors } from "@/lib/vendors";
import { FORMAT_TYPES, getFormatType, vendorsForFormat } from "@/lib/formats";
import { VendorCard } from "@/components/VendorCard";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL } from "@/lib/lists";

export const revalidate = 60;

export function generateStaticParams() {
  return FORMAT_TYPES.map((f) => ({ slug: f.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const f = getFormatType(params.slug);
  if (!f) return { title: "Not found" };
  return {
    title: `${f.name} Companies — OOH Directory`,
    description: f.blurb,
    alternates: { canonical: `${SITE_URL}/formats/${f.slug}` },
  };
}

export default async function FormatPage({
  params,
}: {
  params: { slug: string };
}) {
  const format = getFormatType(params.slug);
  if (!format) notFound();

  const vendors = vendorsForFormat(await getAllVendors(), format);

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${format.name} companies`,
    description: format.blurb,
    numberOfItems: vendors.length,
    itemListElement: vendors.slice(0, 25).map((v, i) => ({
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
      { "@type": "ListItem", position: 2, name: "Formats", item: `${SITE_URL}/formats` },
      { "@type": "ListItem", position: 3, name: format.name },
    ],
  };

  return (
    <section className="wrap page-head" style={{ paddingBottom: 80 }}>
      <JsonLd data={itemList} />
      <JsonLd data={breadcrumb} />
      <div className="crumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/formats">Formats</Link>
        <span>/</span>
        <span>{format.name}</span>
      </div>
      <span className="eyebrow">
        <span className="label label--accent">{format.group}</span>
      </span>
      <h1>{format.name} companies.</h1>
      <p className="lede" style={{ marginBottom: 34, maxWidth: "62ch" }}>
        {format.blurb}
      </p>

      {vendors.length > 0 ? (
        <>
          <p className="hint" style={{ marginBottom: 18 }}>
            {vendors.length} {vendors.length === 1 ? "company" : "companies"} on OOHsource.
          </p>
          <div className="vgrid">
            {vendors.map((v) => (
              <VendorCard key={v.slug} vendor={v} />
            ))}
          </div>
        </>
      ) : (
        <p className="hint">
          No companies listed for this format yet.{" "}
          <Link href="/directory">Browse the full directory</Link> or{" "}
          <Link href="/list-your-company">add your company</Link>.
        </p>
      )}
    </section>
  );
}
