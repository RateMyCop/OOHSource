import Link from "next/link";
import { Vendor } from "@/lib/types";
import { VendorLogo } from "./VendorLogo";

// Card previews show only a short teaser; the full description lives on the
// vendor detail page.
function truncateWords(text: string, max: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= max) return text.trim();
  return words.slice(0, max).join(" ").replace(/[.,;:]$/, "") + "…";
}

// Best available public rating, preferring Google, then Yelp, then Facebook —
// the same precedence used on the profile's Reviews block.
function bestRating(v: Vendor): { rating: number; count: number } | null {
  const sources = [
    [v.googleRating, v.googleReviews],
    [v.yelpRating, v.yelpReviews],
    [v.facebookRating, v.facebookReviews],
  ] as const;
  for (const [rating, count] of sources) {
    if (rating && rating > 0) return { rating, count: count ?? 0 };
  }
  return null;
}

function compactCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "k";
  return String(n);
}

export function VendorCard({ vendor, rank }: { vendor: Vendor; rank?: number }) {
  const review = bestRating(vendor);
  const formats = vendor.formats.slice(0, 2);
  const extraFormats = vendor.formats.length - formats.length;

  return (
    <Link href={`/directory/${vendor.slug}`} className={`vcard tier-${vendor.tier}`}>
      <div className="vcard-top">
        <div className="vcard-lead">
          {typeof rank === "number" && (
            <span className={`vcard-rank${rank <= 3 ? " vcard-rank--top" : ""}`} aria-hidden="true">
              {rank}
            </span>
          )}
          <VendorLogo name={vendor.name} website={vendor.website} logo={vendor.logo} size={40} />
          <div>
            <h3>{vendor.name}</h3>
            <div className="vsub">{vendor.subcategory}</div>
          </div>
        </div>
        <div className="vcard-badges">
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
      </div>

      <p>{truncateWords(vendor.description, 34)}</p>

      <div className="vcard-chips">
        {review && (
          <span
            className="chip chip--rating"
            aria-label={`${review.rating.toFixed(1)} out of 5${review.count ? ` from ${review.count} reviews` : ""}`}
          >
            <span className="chip-star" aria-hidden="true">★</span>
            {review.rating.toFixed(1)}
            {review.count > 0 && <span className="chip-muted">· {compactCount(review.count)}</span>}
          </span>
        )}
        {vendor.coverage && <span className="chip">{vendor.coverage}</span>}
        {formats.map((f) => (
          <span key={f} className="chip chip--soft">{f}</span>
        ))}
        {extraFormats > 0 && <span className="chip chip--soft">+{extraFormats}</span>}
        {vendor.location && <span className="chip chip--loc">{vendor.location}</span>}
      </div>
    </Link>
  );
}
