import { Vendor } from "@/lib/types";

export function Reviews({ vendor }: { vendor: Vendor }) {
  const sources = [
    { key: "Google", rating: vendor.googleRating, count: vendor.googleReviews },
    { key: "Yelp", rating: vendor.yelpRating, count: vendor.yelpReviews },
    { key: "Facebook", rating: vendor.facebookRating, count: vendor.facebookReviews },
  ].filter((s) => s.rating && s.rating > 0);

  if (sources.length === 0) return null;

  return (
    <div className="reviews">
      <div className="reviews-head">Reviews</div>
      {sources.map((s) => (
        <div className="review-row" key={s.key}>
          <span className="review-src">{s.key}</span>
          <span className="review-score">
            <span className="review-star">★</span>
            {(s.rating as number).toFixed(1)}
          </span>
          {s.count ? <span className="review-count">({s.count})</span> : null}
        </div>
      ))}
    </div>
  );
}
