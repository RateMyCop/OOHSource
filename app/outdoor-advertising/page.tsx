import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/lists";
import { CITIES } from "@/lib/cities";
import { JsonLd } from "@/components/JsonLd";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Outdoor Advertising by City — Find OOH Companies Near You",
  description:
    "Find out-of-home advertising companies by city — billboard, transit and DOOH media owners, printers and agencies serving your market. Browse the OOHsource directory free.",
  alternates: { canonical: `${SITE_URL}/outdoor-advertising` },
};

export default function OutdoorAdvertisingHub() {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Outdoor Advertising by City" },
    ],
  };

  return (
    <section className="wrap">
      <JsonLd data={breadcrumb} />
      <div className="page-head">
        <div className="crumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span>Outdoor Advertising by City</span>
        </div>
        <h1>Outdoor Advertising by City</h1>
        <p className="lede">
          Find the out-of-home companies that serve your market — billboard,
          transit, and DOOH media owners, printers, installers, and agencies,
          city by city.
        </p>
      </div>

      <ul className="link-list">
        {CITIES.map((c) => (
          <li key={c.slug}>
            <Link href={`/outdoor-advertising/${c.slug}`}>
              Outdoor Advertising in {c.name}, {c.state}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
