import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategory } from "@/lib/data";
import { getAllVendors, getVendorBySlug, resolveVendorForPage } from "@/lib/vendors";
import { VendorCard } from "@/components/VendorCard";
import { ReportIssue } from "@/components/ReportIssue";
import { VendorLogo } from "@/components/VendorLogo";
import { ClaimListing } from "@/components/ClaimListing";
import { ContactCompany } from "@/components/ContactCompany";
import { SocialLinks } from "@/components/SocialLinks";
import { Reviews } from "@/components/Reviews";
import { HeroImage } from "@/components/HeroImage";
import { InfoTip } from "@/components/InfoTip";
import { NativeReviews } from "@/components/NativeReviews";
import { getPublishedReviews, aggregate } from "@/lib/reviews";
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
  // Build a title that fills the useful length band. The " | OOHsource" suffix
  // adds 12 chars, so we cap the built part at ~48 to stay under ~60 total, and
  // enrich short/empty-subcategory names with the category and HQ city so they
  // stop landing in the "title too short" bucket.
  const TITLE_CAP = 48;
  const categoryName = (getCategory(vendor.categorySlug)?.name || "").trim();
  const city = (vendor.location.split(",")[0] || "").trim();
  // Names that carry a long parenthetical ("Acme (formerly Foo Corp, LLC)")
  // blow past the cap on their own; drop the parenthetical for the tag only.
  let title = vendor.name.trim();
  if (title.length > TITLE_CAP) {
    const bare = title.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
    if (bare.length >= 3) title = bare;
  }
  // Prefer the specific subcategory; when that is too long to fit, fall back
  // to the category name rather than dropping the role entirely (which left
  // titles like "Orb in Dublin").
  const roles = [(vendor.subcategory || "").trim(), categoryName].filter(Boolean);
  const role = roles.find((r) => title.length + 3 + r.length <= TITLE_CAP);
  if (role) title += ` — ${role}`;
  if (city && city.length <= 22 && title.length + 4 + city.length <= TITLE_CAP) {
    title += ` in ${city}`;
  }
  // Listings with no description yet still need a meta description; build a
  // factual one from the fields we do have.
  const fallbackDescription = [
    `${vendor.name} is ${/^[aeiou]/i.test(roles[0] || "") ? "an" : "a"} ${(
      roles[0] || "out-of-home company"
    ).toLowerCase()}${vendor.location ? ` based in ${vendor.location}` : ""}.`,
    "Website, contact details, reviews and more on OOHsource, the global out-of-home advertising directory.",
  ].join(" ");
  const description = metaSnippet(vendor.description || fallbackDescription, 155);
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
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { review?: string };
}) {
  // resolveVendorForPage() only reports a real 404 when the vendor is absent
  // from authoritative Airtable data; during a degraded fallback it throws
  // rather than let Next cache a 404 for a listing that likely exists.
  const vendor = await resolveVendorForPage(params.slug);
  if (!vendor) notFound();

  // Native OOHsource reviews (build-safe cached read).
  const reviews = await getPublishedReviews(params.slug);
  const reviewAgg = aggregate(reviews);
  const reviewInvited = searchParams?.review === "1";

  const category = getCategory(vendor.categorySlug);

  // Related-vendor cross-links. We link peers on THREE axes — same category,
  // same city, and shared format — so every listing collects inbound links from
  // several directions and the internal-link graph stays dense (helps crawl and
  // indexation; no profile is left with only one inbound link). Each axis takes
  // a rotating window seeded from this vendor's position, so different profiles
  // surface different peers instead of all pointing at the same top few.
  const allVendors = await getAllVendors();
  const anchorIdx = Math.max(0, allVendors.findIndex((v) => v.slug === vendor.slug));
  const windowFrom = <T,>(list: T[], count: number): T[] => {
    if (!list.length) return [];
    const start = ((anchorIdx % list.length) + list.length) % list.length;
    const out: T[] = [];
    for (let i = 0; i < Math.min(count, list.length); i++) {
      out.push(list[(start + i) % list.length]);
    }
    return out;
  };

  // 1) Same category — shown as full cards (existing behavior).
  const related = windowFrom(
    allVendors.filter((v) => v.categorySlug === vendor.categorySlug && v.slug !== vendor.slug),
    6
  );
  const shown = new Set<string>([vendor.slug, ...related.map((v) => v.slug)]);

  // 2) Same city — a geographic axis. Skip vague/non-city locations.
  const cityKey = (s: string) => (s.split(",")[0] || "").trim().toLowerCase();
  const cityName = (vendor.location.split(",")[0] || "").trim();
  const GENERIC_CITY = new Set(["", "worldwide", "global", "united states", "usa", "national", "n/a"]);
  const cityPeers = GENERIC_CITY.has(cityName.toLowerCase())
    ? []
    : windowFrom(
        allVendors.filter((v) => !shown.has(v.slug) && cityKey(v.location) === cityName.toLowerCase()),
        8
      );
  cityPeers.forEach((v) => shown.add(v.slug));

  // 3) Shared primary format — a service axis.
  const primaryFormat = vendor.formats[0] || "";
  const formatPeers = primaryFormat
    ? windowFrom(
        allVendors.filter((v) => !shown.has(v.slug) && v.formats.includes(primaryFormat)),
        8
      )
    : [];

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
    ...(reviewAgg.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: reviewAgg.average,
            reviewCount: reviewAgg.count,
            bestRating: 5,
          },
          review: reviews.slice(0, 20).map((r) => ({
            "@type": "Review",
            reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
            author: {
              "@type": r.company ? "Organization" : "Person",
              name: r.company || r.name,
            },
            ...(r.title ? { name: r.title } : {}),
            reviewBody: r.body,
            datePublished: r.created.slice(0, 10),
          })),
        }
      : vendor.googleRating && vendor.googleReviews
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
              <>
                <Link
                  href="/how-verification-works"
                  className="badge badge--verified badge--link"
                  title="How verification works"
                >
                  <span className="v" />
                  Verified
                </Link>
                <InfoTip label="Confirmed against the company’s own website and primary sources — not scraped or auto-listed. Click to see how verification works." />
              </>
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

          <div className="detail-section">
            <NativeReviews
              slug={vendor.slug}
              reviews={reviews}
              agg={reviewAgg}
              defaultOpen={reviewInvited}
              source={reviewInvited ? "invited" : "direct"}
            />
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

          {cityPeers.length >= 2 && (
            <div className="detail-section">
              <h2>Other OOH companies in {cityName}</h2>
              <ul className="rel-links">
                {cityPeers.map((v) => (
                  <li key={v.slug}>
                    <Link href={`/directory/${v.slug}`}>{v.name}</Link>
                    <span className="rel-meta">
                      {v.subcategory || getCategory(v.categorySlug)?.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {formatPeers.length >= 2 && (
            <div className="detail-section">
              <h2>Also offering {primaryFormat}</h2>
              <ul className="rel-links">
                {formatPeers.map((v) => (
                  <li key={v.slug}>
                    <Link href={`/directory/${v.slug}`}>{v.name}</Link>
                    <span className="rel-meta">{v.location}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="detail-aside">
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
            <ContactCompany slug={vendor.slug} name={vendor.name} />
            {vendor.tier !== "Featured" && (
              <FeatureButton slug={vendor.slug} />
            )}
            <ClaimListing vendorName={vendor.name} vendorSlug={vendor.slug} />
            <div style={{ textAlign: "center", marginTop: 4 }}>
              <ReportIssue vendorName={vendor.name} vendorSlug={vendor.slug} />
            </div>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}
