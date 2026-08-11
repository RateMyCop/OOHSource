"use client";

import { useState } from "react";

type Series = { view: number[]; website: number[]; email: number[] };
type Totals = { view: number; website: number; email: number };

const METRICS = [
  { key: "view", label: "Views" },
  { key: "website", label: "Website clicks" },
  { key: "email", label: "Email clicks" },
] as const;
type MetricKey = (typeof METRICS)[number]["key"];

const RANGES = [30, 60, 90] as const;
type Range = (typeof RANGES)[number];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmtDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${MONTHS[Number(m) - 1]} ${Number(d)}`;
}
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

export function Analytics({
  dates,
  series,
  totalsAllTime,
}: {
  dates: string[];
  series: Series;
  totalsAllTime: Totals;
}) {
  const [range, setRange] = useState<Range>(30);
  const [metric, setMetric] = useState<MetricKey>("view");

  const n = dates.length;
  const from = Math.max(0, n - range);
  const prevFrom = Math.max(0, n - 2 * range);
  const cur = (arr: number[]) => arr.slice(from);
  const prev = (arr: number[]) => arr.slice(prevFrom, from);

  const rangeDates = dates.slice(from);
  const data = cur(series[metric]);

  function delta(curSum: number, prevSum: number) {
    if (prevSum === 0) return curSum > 0 ? { txt: "new", cls: "up" } : { txt: "—", cls: "flat" };
    const d = Math.round(((curSum - prevSum) / prevSum) * 100);
    return { txt: `${d >= 0 ? "+" : ""}${d}%`, cls: d > 0 ? "up" : d < 0 ? "down" : "flat" };
  }

  // Chart geometry (SVG user units; scales to container width). Wide, short
  // aspect ratio keeps the rendered chart compact.
  const W = 1000;
  const H = 200;
  const padB = 24;
  const max = Math.max(1, ...data);
  const bw = W / Math.max(1, data.length);
  const barW = Math.max(1, bw * 0.66);
  const barGap = (bw - barW) / 2;
  const chartH = H - padB;

  // Up to 5 evenly spaced x-axis labels.
  const ticks = data.length
    ? Array.from({ length: Math.min(5, data.length) }, (_, i) =>
        Math.round((i * (data.length - 1)) / Math.max(1, Math.min(5, data.length) - 1))
      )
    : [];

  return (
    <div className="an-panel">
      <div className="an-head">
        <div className="an-ranges" role="tablist" aria-label="Date range">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              className={`an-range${range === r ? " an-range--active" : ""}`}
              aria-pressed={range === r}
              onClick={() => setRange(r)}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      <div className="an-tiles">
        {METRICS.map((m) => {
          const c = sum(cur(series[m.key]));
          const p = sum(prev(series[m.key]));
          const dl = delta(c, p);
          return (
            <button
              key={m.key}
              type="button"
              className={`an-tile${metric === m.key ? " an-tile--active" : ""}`}
              onClick={() => setMetric(m.key)}
              aria-pressed={metric === m.key}
            >
              <span className="an-tile-num">{c.toLocaleString()}</span>
              <span className="an-tile-label">{m.label}</span>
              <span className="an-tile-meta">
                <span className={`an-delta an-delta--${dl.cls}`}>{dl.txt}</span>
                <span className="an-alltime">{totalsAllTime[m.key].toLocaleString()} all-time</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="an-chart-wrap">
        <div className="an-chart-cap">
          {sum(data).toLocaleString()} {METRICS.find((m) => m.key === metric)!.label.toLowerCase()} · last {range} days
        </div>
        <svg className="an-chart" viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${metric} over ${range} days`}>
          <line x1="0" y1={chartH} x2={W} y2={chartH} stroke="var(--line)" strokeWidth="1" />
          {data.map((v, i) => {
            const h = (v / max) * (chartH - 4);
            const x = i * bw + barGap;
            const y = chartH - h;
            return (
              <rect key={i} x={x} y={y} width={barW} height={h} rx="1" fill="var(--accent)">
                <title>{`${fmtDate(rangeDates[i])}: ${v}`}</title>
              </rect>
            );
          })}
          {ticks.map((ti) => (
            <text
              key={ti}
              x={ti * bw + bw / 2}
              y={H - 6}
              textAnchor="middle"
              className="an-xlabel"
            >
              {rangeDates[ti] ? fmtDate(rangeDates[ti]) : ""}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}
