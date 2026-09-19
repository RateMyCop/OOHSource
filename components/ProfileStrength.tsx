import Link from "next/link";
import type { Vendor } from "@/lib/types";

// Clutch-style "profile completeness" meter. Scores only owner-editable fields
// (all fixable in the listing editor), so every incomplete item links to a real
// fix. Drives better listings — and a stronger listing converts to Featured.
type Item = { label: string; done: boolean; weight: number };

function items(vendor: Vendor): Item[] {
  const words = (vendor.description || "").trim().split(/\s+/).filter(Boolean).length;
  return [
    { label: "Write a full description (40+ words)", done: words >= 40, weight: 25 },
    { label: "Add a banner image", done: Boolean(vendor.heroImage), weight: 20 },
    { label: "Add 3+ portfolio photos", done: (vendor.gallery?.length || 0) >= 3, weight: 20 },
    { label: "Add your website", done: Boolean(vendor.website), weight: 15 },
    { label: "Add a public phone number", done: Boolean(vendor.phone), weight: 10 },
    { label: "Add your business address", done: Boolean(vendor.address), weight: 10 },
  ];
}

export function ProfileStrength({ vendor, slug }: { vendor: Vendor; slug: string }) {
  const list = items(vendor);
  const percent = list.filter((i) => i.done).reduce((s, i) => s + i.weight, 0);
  const missing = list.filter((i) => !i.done);
  const editHref = `/dashboard?tab=edit&slug=${slug}`;
  const tone = percent >= 90 ? "hi" : percent >= 60 ? "mid" : "lo";

  return (
    <div className="pstrength" data-tone={tone}>
      <div className="pstrength-top">
        <span className="pstrength-label">Profile strength</span>
        <span className="pstrength-pct">{percent}%</span>
      </div>
      <div className="pstrength-bar" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: `${percent}%` }} />
      </div>
      {missing.length === 0 ? (
        <p className="pstrength-done">🎉 Your profile is complete — nicely done.</p>
      ) : (
        <ul className="pstrength-list">
          {list.map((i) => (
            <li key={i.label} className={i.done ? "is-done" : "is-todo"}>
              <span className="pstrength-mark" aria-hidden="true">{i.done ? "✓" : "○"}</span>
              {i.done ? (
                <span>{i.label}</span>
              ) : (
                <Link href={editHref}>{i.label} →</Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
