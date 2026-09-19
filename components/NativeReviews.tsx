import { ReviewForm } from "./ReviewForm";
import type { PublicReview, ReviewAggregate } from "@/lib/reviews";

export function Stars({ value }: { value: number }) {
  const full = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span className="rev-stars" aria-hidden="true">
      {"★★★★★".slice(0, full)}
      <span className="rev-stars-off">{"★★★★★".slice(full)}</span>
    </span>
  );
}

export function NativeReviews({
  slug,
  reviews,
  agg,
  defaultOpen,
  source,
}: {
  slug: string;
  reviews: PublicReview[];
  agg: ReviewAggregate;
  defaultOpen: boolean;
  source: "direct" | "invited";
}) {
  return (
    <section className="reviews-native" id="reviews">
      <div className="reviews-head">
        <h2>
          Reviews
          {agg.count > 0 && (
            <span className="reviews-agg">
              <Stars value={agg.average} /> {agg.average.toFixed(1)} ·{" "}
              {agg.count} review{agg.count !== 1 ? "s" : ""}
            </span>
          )}
        </h2>
        <ReviewForm slug={slug} defaultOpen={defaultOpen} source={source} />
      </div>

      {reviews.length === 0 ? (
        <p className="hint reviews-empty">
          No reviews yet — if you&rsquo;ve worked with this company, be the first
          to leave one.
        </p>
      ) : (
        <ul className="rev-list">
          {reviews.map((r) => (
            <li key={r.id} className="rev-item">
              <div className="rev-item-top">
                <Stars value={r.rating} />
                <span className="rev-when">
                  {new Date(r.created).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              {r.title && <h3 className="rev-title">{r.title}</h3>}
              <p className="rev-body">{r.body}</p>
              <div className="rev-by">
                — {r.name}
                {r.company ? `, ${r.company}` : ""}
              </div>
              {r.response && (
                <div className="rev-response">
                  <span className="rev-response-h">Response from the company</span>
                  <p>{r.response}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
