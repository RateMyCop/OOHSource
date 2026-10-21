import type { Metadata } from "next";
import Link from "next/link";
import { getIndustryNews, NEWS_SOURCES } from "@/lib/news";
import { NewsThumb } from "@/components/NewsThumb";
import { SITE_URL } from "@/lib/lists";

export const revalidate = 1800; // 30 min

export const metadata: Metadata = {
  title: "OOH News — Out-of-Home Advertising Industry Headlines",
  description:
    "The latest out-of-home and DOOH advertising news, aggregated from leading industry publishers. Headlines, sources, and links to the full stories.",
  alternates: { canonical: `${SITE_URL}/news` },
};

function when(iso: string): string {
  if (!iso) return "";
  const d = Date.now() - new Date(iso).getTime();
  const days = Math.floor(d / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function NewsPage() {
  const items = await getIndustryNews();
  // Lead with a story that has a photo when possible, so the hero always lands.
  const hero = items.find((i) => i.image) || items[0];
  const rest = items.filter((i) => i !== hero);

  return (
    <section className="wrap" style={{ paddingBottom: 80 }}>
      <div className="page-head">
        <div className="crumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span>News</span>
        </div>
        <h1>Out-of-home news.</h1>
        <p className="lede" style={{ maxWidth: "62ch" }}>
          The latest from across the out-of-home &amp; DOOH industry, pulled from{" "}
          {NEWS_SOURCES.join(", ")} and more. Every headline links to the original
          publisher.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="hint" style={{ marginTop: 10 }}>
          Headlines are loading — check back shortly, or browse the{" "}
          <Link href="/directory">directory</Link> in the meantime.
        </p>
      ) : (
        <>
          {hero && (
            <a
              href={hero.link}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="news-hero"
            >
              <NewsThumb image={hero.image} logo={hero.sourceLogo} source={hero.source} title={hero.title} kind="hero" />
              <div className="news-hero-body">
                <div className="news-kick">
                  <span className="news-src">{hero.source}</span>
                  {hero.date && <span className="news-date">{when(hero.date)}</span>}
                </div>
                <h2 className="news-hero-title">{hero.title}</h2>
                {hero.excerpt && <p className="news-hero-excerpt">{hero.excerpt}</p>}
                <span className="news-read">Read on {hero.source} →</span>
              </div>
            </a>
          )}

          <div className="news-grid">
            {rest.map((n) => (
              <a
                key={n.link}
                href={n.link}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="news-card"
              >
                <NewsThumb image={n.image} logo={n.sourceLogo} source={n.source} title={n.title} kind="card" />
                <div className="news-card-body">
                  <div className="news-kick">
                    <span className="news-src">{n.source}</span>
                    {n.date && <span className="news-date">{when(n.date)}</span>}
                  </div>
                  <h3 className="news-card-title">{n.title}</h3>
                </div>
              </a>
            ))}
          </div>
        </>
      )}

      <p className="hint" style={{ marginTop: 40, maxWidth: "62ch" }}>
        OOHsource aggregates public headlines from industry publishers and links
        to their full stories. Want your publication included?{" "}
        <Link href="/contact">Let us know.</Link>
      </p>
    </section>
  );
}
