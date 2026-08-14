import type { Metadata } from "next";
import Link from "next/link";
import { PUB_GROUPS, publicationsOfTypes } from "@/lib/publications";
import { VendorLogo } from "@/components/VendorLogo";
import { SuggestEdit } from "@/components/SuggestEdit";
import { SITE_URL } from "@/lib/lists";

export const metadata: Metadata = {
  title: "OOH Industry Media — Publications, Podcasts & Associations",
  description:
    "The trade press, news sites, newsletters, podcasts, associations, and measurement bodies of the out-of-home advertising industry — one curated place to follow OOH.",
  alternates: { canonical: `${SITE_URL}/publications` },
};

export default function PublicationsIndexPage() {
  return (
    <section className="wrap page-head" style={{ paddingBottom: 90 }}>
      <div className="crumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span>Industry Media</span>
      </div>
      <span className="eyebrow">
        <span className="label label--accent">Industry media</span>
      </span>
      <h1>Who covers out-of-home.</h1>
      <p className="lede" style={{ marginBottom: 16, maxWidth: "60ch" }}>
        The publications, podcasts, associations, and measurement bodies of the
        out-of-home advertising industry — in one place.
      </p>
      <p className="hub-copy" style={{ marginBottom: 40 }}>
        Out-of-home has its own tight-knit press and trade community: daily news
        sites and newsletters tracking every acquisition and digital rollout,
        podcasts where operators and buyers talk shop, and the associations and
        audience-measurement organizations that set the standards the whole
        industry buys on. This is a curated directory of them — a companion to
        the vendor directory for anyone who wants to follow where OOH is headed,
        not just who to hire. Each listing links straight to the source.
      </p>

      {PUB_GROUPS.map((group) => {
        const pubs = publicationsOfTypes(group.types);
        if (pubs.length === 0) return null;
        return (
          <div
            key={group.key}
            className="detail-section"
            style={{ borderTop: "1px solid var(--line)" }}
          >
            <h2>{group.label}</h2>
            <p className="hint" style={{ marginBottom: 20 }}>
              {group.blurb}
            </p>
            <div className="pub-grid">
              {pubs.map((p) => (
                <Link
                  key={p.slug}
                  className="pub-card"
                  href={`/publications/${p.slug}`}
                >
                  <VendorLogo name={p.name} website={p.website} size={38} />
                  <span className="pub-card-text">
                    <span className="pub-card-name">{p.name}</span>
                    <span className="pub-card-meta">
                      {p.type} · {p.cadence}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        );
      })}

      <div className="detail-section" style={{ borderTop: "1px solid var(--line)" }}>
        <h2>Missing something?</h2>
        <p className="hint" style={{ marginBottom: 4 }}>
          Know an OOH publication, newsletter, or podcast we should add — or spot
          something to fix? Let us know.
        </p>
        <SuggestEdit />
      </div>
    </section>
  );
}
