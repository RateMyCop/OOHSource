import type { Metadata } from "next";
import Link from "next/link";
import { getAllVendors } from "@/lib/vendors";
import { FORMAT_GROUPS, FORMAT_TYPES, vendorsForFormat } from "@/lib/formats";
import { SITE_URL } from "@/lib/lists";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Browse OOH by Format — Billboards, Transit, DOOH & More",
  description:
    "Explore out-of-home advertising by format — digital billboards, transit, street furniture, place-based, wild posting and more — and find the companies that operate each.",
  alternates: { canonical: `${SITE_URL}/formats` },
};

export default async function FormatsIndexPage() {
  const vendors = await getAllVendors();
  const counts = new Map(
    FORMAT_TYPES.map((f) => [f.slug, vendorsForFormat(vendors, f).length])
  );

  return (
    <section className="wrap page-head" style={{ paddingBottom: 90 }}>
      <div className="crumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span>Formats</span>
      </div>
      <span className="eyebrow">
        <span className="label label--accent">Browse by format</span>
      </span>
      <h1>Out-of-home by format.</h1>
      <p className="lede" style={{ marginBottom: 16, maxWidth: "60ch" }}>
        Every major out-of-home format, and the media owners, agencies, and tech
        companies that operate them.
      </p>
      <p className="hub-copy" style={{ marginBottom: 40 }}>
        Choose a format to see every vendor that runs it, worldwide — from
        classic bulletins, wallscapes, and posters to programmatic DOOH networks,
        transit and bus wraps, bus shelters, mall and place-based screens, and
        experiential activations. Each format page is generated live from the
        directory, so the list grows automatically as new operators are added
        and verified. It&rsquo;s the fastest way to move from &ldquo;I need digital
        billboards in these markets&rdquo; to a shortlist of companies that
        actually offer them.
      </p>

      {FORMAT_GROUPS.map((group) => {
        const types = FORMAT_TYPES.filter((f) => f.group === group);
        return (
          <div key={group} className="detail-section" style={{ borderTop: "1px solid var(--line)" }}>
            <h2>{group}</h2>
            <div className="fmt-index-grid">
              {types.map((f) => (
                <Link key={f.slug} className="fmt-index-item" href={`/formats/${f.slug}`}>
                  <span className="fmt-index-name">{f.name}</span>
                  <span className="fmt-index-count">{counts.get(f.slug) ?? 0}</span>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
