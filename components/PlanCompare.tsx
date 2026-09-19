// Free vs Featured comparison table — shared by the /pricing page and the
// dashboard Packages tab so they never drift apart.
const ROWS: { label: string; free: boolean | string; featured: boolean | string }[] = [
  { label: "Directory listing in your category", free: true, featured: true },
  { label: "Full company description", free: true, featured: true },
  { label: "Website, phone & contact email", free: true, featured: true },
  { label: "Social links", free: true, featured: true },
  { label: "Google & Yelp review ratings", free: true, featured: true },
  { label: "Hero banner image", free: true, featured: true },
  { label: "Claim & keep your details current", free: true, featured: true },
  { label: "Placement in category", free: "Standard", featured: "Top of category" },
  { label: "Search ranking", free: "Standard", featured: "Priority" },
  { label: "Featured badge", free: false, featured: true },
  { label: "Verified badge", free: false, featured: true },
  { label: "Homepage & “Just added” spotlight", free: false, featured: true },
  { label: "Support", free: "Community", featured: "Priority" },
];

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <span className="pc-yes" role="img" aria-label="Included">✓</span>;
  if (value === false) return <span className="pc-no" role="img" aria-label="Not included">—</span>;
  return <span className="pc-txt">{value}</span>;
}

export function PlanCompare({ heading = "Compare plans" }: { heading?: string }) {
  return (
    <div className="compare">
      {heading && <h2>{heading}</h2>}
      <div className="compare-scroll">
        <table className="compare-table">
          <thead>
            <tr>
              <th>Feature</th>
              <th>Free</th>
              <th className="th-feat">Featured</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.label}>
                <td>{r.label}</td>
                <td><Cell value={r.free} /></td>
                <td className="td-feat"><Cell value={r.featured} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
