import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  PUBLICATIONS,
  getPublication,
  type PubType,
} from "@/lib/publications";
import { VendorLogo } from "@/components/VendorLogo";
import { SuggestEdit } from "@/components/SuggestEdit";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL } from "@/lib/lists";

export function generateStaticParams() {
  return PUBLICATIONS.map((p) => ({ slug: p.slug }));
}

const SCHEMA_TYPE: Record<PubType, string> = {
  Publication: "Periodical",
  News: "NewsMediaOrganization",
  Newsletter: "Periodical",
  Podcast: "PodcastSeries",
  Association: "Organization",
  Measurement: "Organization",
};

// Split a long block into a couple of readable paragraphs on sentence bounds.
function paras(text: string): string[] {
  const s = (text || "")
    .trim()
    .split(/(?<=[.!?])\s+(?=[A-Z"'])/)
    .map((x) => x.trim())
    .filter(Boolean);
  if (s.length <= 3) return [text.trim()];
  const per = Math.ceil(s.length / 2);
  return [s.slice(0, per).join(" "), s.slice(per).join(" ")];
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const p = getPublication(params.slug);
  if (!p) return { title: "Not found" };
  const title = `${p.name} — OOH ${p.type}`;
  const description =
    p.description.length > 155
      ? p.description.slice(0, 152).replace(/[,;:.\s]+$/, "") + "…"
      : p.description;
  return {
    title: title.length <= 60 ? title : p.name,
    description,
    alternates: { canonical: `${SITE_URL}/publications/${p.slug}` },
    openGraph: { type: "article", title, description },
  };
}

export default function PublicationPage({
  params,
}: {
  params: { slug: string };
}) {
  const p = getPublication(params.slug);
  if (!p) notFound();

  const ld = {
    "@context": "https://schema.org",
    "@type": SCHEMA_TYPE[p.type],
    name: p.name,
    url: p.website || `${SITE_URL}/publications/${p.slug}`,
    description: p.description,
    ...(p.founded ? { foundingDate: p.founded } : {}),
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Industry Media",
        item: `${SITE_URL}/publications`,
      },
      { "@type": "ListItem", position: 3, name: p.name },
    ],
  };

  return (
    <section className="wrap page-head" style={{ paddingBottom: 80 }}>
      <JsonLd data={ld} />
      <JsonLd data={breadcrumb} />
      <div className="crumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/publications">Industry Media</Link>
        <span>/</span>
        <span>{p.name}</span>
      </div>

      <div className="pub-head">
        <VendorLogo name={p.name} website={p.website} size={56} />
        <div>
          <span className="eyebrow">
            <span className="label label--accent">{p.type}</span>
          </span>
          <h1 style={{ margin: "6px 0 0" }}>{p.name}</h1>
        </div>
      </div>

      <p className="hint" style={{ margin: "14px 0 26px" }}>
        {[p.cadence, p.location, p.founded && `Est. ${p.founded}`]
          .filter(Boolean)
          .join("  ·  ")}
      </p>

      {paras(p.description).map((para, i) => (
        <p key={i} className="hub-copy" style={{ maxWidth: "66ch" }}>
          {para}
        </p>
      ))}

      {p.website && (
        <p style={{ marginTop: 26 }}>
          <a
            className="load-more"
            href={p.website}
            target="_blank"
            rel="noopener"
          >
            Visit {p.name} ↗
          </a>
        </p>
      )}

      {p.topics.length > 0 && (
        <div className="detail-section" style={{ borderTop: "1px solid var(--line)", marginTop: 34 }}>
          <h2>Covers</h2>
          <div className="tags">
            {p.topics.map((t) => (
              <span key={t} className="tag">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      <SuggestEdit context={`Edit: ${p.name}`} />

      <p className="hint" style={{ marginTop: 40 }}>
        <Link href="/publications">← All industry media</Link>
      </p>
    </section>
  );
}
