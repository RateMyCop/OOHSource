// Tiny inline-SVG sparkline. Pure/server-rendered — no client JS. Draws a
// filled area + line for a series of daily counts.
export function Sparkline({
  data,
  width = 320,
  height = 48,
}: {
  data: number[];
  width?: number;
  height?: number;
}) {
  const n = data.length;
  const max = Math.max(1, ...data);
  const pad = 2;
  const w = width - pad * 2;
  const h = height - pad * 2;

  // Guard: a single point can't form a line.
  const x = (i: number) => (n <= 1 ? pad : pad + (i / (n - 1)) * w);
  const y = (v: number) => pad + h - (v / max) * h;

  const line = data.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${pad},${pad + h} ${line} ${(pad + w).toFixed(1)},${pad + h}`;

  return (
    <svg
      className="spark"
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      role="img"
      aria-hidden="true"
    >
      <polygon points={area} fill="var(--accent-soft)" />
      <polyline
        points={line}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
