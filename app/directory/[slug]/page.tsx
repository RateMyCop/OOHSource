import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategory } from "@/lib/data";
import { getAllVendors, getVendorBySlug, getVendorsByCategory } from "@/lib/vendors";
import { VendorCard } from "@/components/VendorCard";
import { ReportIssue } from "@/components/ReportIssue";
import { VendorLogo } from "@/components/VendorLogo";
import { ClaimListing } from "@/components/ClaimListing";
import { SocialLinks } from "@/components/SocialLinks";
import { Reviews } from "@/components/Reviews";
import { HeroImage } from "@/components/HeroImage";
import { Gallery } from "@/components/Gallery";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL } from "@/lib/lists";
import { FeatureButton } from "@/components/FeatureButton";
import { TrackView, TrackedLink } from "@/components/Track";

export const revalidate = 60;

// Split a long single-block description into a few readable paragraphs.
// Respects existing line breaks; otherwise groups sentences into ~3 paragraphs.
function toParagraphs(text: string): string[] {
  const t = (text || "").trim();
  if (!t) return [];
  if (/\n/.test(t)) {
    const parts = t.split(/\n+/).map((s) => s.trim()).filter(Boolean);
    if (parts.length > 1) return parts;
  }
  // Split on sentence boundaries: whitespace preceded by . ! ? and followed by
  // a capital letter or quote. Uses split (never drops text) and the capital
  // lookahead keeps abbreviations like "U.S. media" intact.
  const sentences = t
    .split(/(?<=[.!?])\s+(?=[A-Z"'])/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length <= 3) return [t];
  const per = Math.ceil(sentences.length / 3);
  const paras: string[] = [];
  for (let i = 0; i < sentences.length; i += per) {
    paras.push(sentences.slice(i, i + per).join(" "));
  }
  return paras;
}

// Trim a long description to a clean ~N-char meta snippet on a word boundary.
function metaSnippet(text: string, max: number): string {
  const t = (text || "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.\s]+$/, "") + "…";
}

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
  if (!vendor) return { title: "Not found" };
  const url = `${SITE_URL}/directory/${vendor.slug}`;
  const title = `${vendor.name} — ${vendor.subcategory}`;
  const description = metaSnippet(vendor.description, 155);
  const images = vendor.heroImage ? [vendor.heroImage] : undefined;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "profile",
      url,
      title,
      description,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title,
      description,
      ...(images ? { images } : {}),
    },
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

  const sameAs = [
    vendor.linkedin,
    vendor.x,
    vendor.facebook,
    vendor.instagram,
    vendor.youtube,
  ].filter(Boolean);

  const orgLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: vendor.name,
    url: vendor.website || `${SITE_URL}/directory/${vendor.slug}`,
    description: vendor.description,
    ...(vendor.logo ? { logo: vendor.logo } : {}),
    ...(vendor.heroImage ? { image: vendor.heroImage } : {}),
    ...(vendor.contactEmail ? { email: vendor.contactEmail } : {}),
    ...(vendor.phone ? { telephone: vendor.phone } : {}),
    ...(vendor.address
      ? { address: { "@type": "PostalAddress", streetAddress: vendor.address } }
      : {}),
    ...(sameAs.length ? { sameAs } : {}),
    ...(vendor.googleRating && vendor.googleReviews
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: vendor.googleRating,
            reviewCount: vendor.googleReviews,
            bestRating: 5,
          },
        }
      : {}),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Directory", item: `${SITE_URL}/directory` },
      ...(category
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: category.name,
              item: `${SITE_URL}/category/${category.slug}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: category ? 4 : 3,
        name: vendor.name,
      },
    ],
  };

  return (
    <section className="wrap">
      <JsonLd data={orgLd} />
      <JsonLd data={breadcrumbLd} />
      <TrackView slug={vendor.slug} />
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
          {vendor.heroImage && (
            <HeroImage src={vendor.heroImage} alt={vendor.name} />
          )}
          <div className="detail-badges">
            {vendor.tier === "Featured" && (
              <span className="badge badge--featured">Featured</span>
            )}
            {vendor.verified && (
              <span className="badge badge--verified">
                <span className="v" />
                Verified
              </span>
            )}
          </div>

          <div className="detail-title-row">
            <VendorLogo name={vendor.name} website={vendor.website} logo={vendor.logo} size={64} />
            <h1>{vendor.name}</h1>
          </div>
          <div className="detail-about">
            {toParagraphs(vendor.description).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          {vendor.gallery && vendor.gallery.length > 0 && (
            <div className="detail-section">
              <h2>Portfolio</h2>
              <Gallery images={vendor.gallery} name={vendor.name} />
            </div>
          )}

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

          {vendor.marketsServed && vendor.marketsServed.length > 0 && (
            <div className="detail-section">
              <h2>Markets served</h2>
              <div className="spec-list">
                {vendor.marketsServed.map((m) => (
                  <span key={m} className="tag">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}

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
          <div className="aside-stack">
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
            {vendor.contactEmail && (
              <div className="aside-row">
                <span className="k">Email</span>
                <TrackedLink
                  slug={vendor.slug}
                  event="email"
                  href={`mailto:${vendor.contactEmail}`}
                  className="val"
                >
                  {vendor.contactEmail}
                </TrackedLink>
              </div>
            )}
            <SocialLinks vendor={vendor} />
          </div>
          <div className="aside-card">
            <Reviews vendor={vendor} />
            <TrackedLink
              slug={vendor.slug}
              event="website"
              href={vendor.website}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="btn btn--primary"
            >
              Visit website →
            </TrackedLink>
            {vendor.tier !== "Featured" && (
              <FeatureButton slug={vendor.slug} />
            )}
            <ClaimListing vendorName={vendor.name} vendorSlug={vendor.slug} />
            <div style={{ textAlign: "center", marginTop: 4 }}>
              <ReportIssue vendorName={vendor.name} vendorSlug={vendor.slug} />
            </div>
          </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
