import type { Vendor } from "@/lib/types";
import type { VendorAiVis } from "@/lib/aivis";

function Gauge({ value, band }: { value: number; band: string }) {
  const cx = 110, cy = 100, r = 82;
  const a = Math.PI * (1 - Math.min(1, Math.max(0, value)));
  const nx = cx + r * Math.cos(a);
  const ny = cy - r * Math.sin(a);
  return (
    <svg width="220" height="128" viewBox="0 0 220 128" aria-hidden="true">
      <defs>
        <linearGradient id="avg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#c0392b" />
          <stop offset="0.5" stopColor="#e6a340" />
          <stop offset="1" stopColor="#2c8a5a" />
        </linearGradient>
      </defs>
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="url(#avg)" strokeWidth="14" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="5" fill="var(--ink)" />
      <text x={cx} y={cy - 16} textAnchor="middle" fontSize="17" fontWeight="800" fill="var(--ink)" fontFamily="var(--font-display), sans-serif">{band}</text>
    </svg>
  );
}

export function AiVisibility({ vendor, data }: { vendor: Vendor; data: VendorAiVis }) {
  if (!data.ran) {
    return (
      <div className="aiv">
        <div className="aiv-head">
          <h2>AI Visibility</h2>
          <p className="hint" style={{ margin: 0 }}>How often AI search engines (ChatGPT, Claude, Perplexity) cite your listing.</p>
        </div>
        <p className="hint">Your first AI Visibility report is being generated — check back soon.</p>
      </div>
    );
  }

  const when = data.at ? new Date(data.at).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "";

  return (
    <div className="aiv">
      <div className="aiv-head">
        <div>
          <h2>AI Visibility</h2>
          <p className="hint" style={{ margin: 0 }}>How often AI search engines cite your listing when buyers ask about out-of-home. Updated {when}.</p>
        </div>
      </div>

      <div className="aiv-stats">
        <div className="aiv-stat"><span className="aiv-num">{data.citations}</span><span className="aiv-lab">Your AI citations</span></div>
        <div className="aiv-stat"><span className="aiv-num">{data.catAvg}</span><span className="aiv-lab">Category average</span></div>
        <div className="aiv-stat"><span className="aiv-num">{data.catTop}</span><span className="aiv-lab">Top performer</span></div>
      </div>

      <div className="aiv-score">
        <div className="aiv-gauge">
          <Gauge value={data.gauge} band={data.band} />
        </div>
        <div className="aiv-score-side">
          <div className="aiv-rank">
            <div><span className="aiv-num">#{data.rank}</span><span className="aiv-lab">of {data.totalVendors.toLocaleString()} vendors</span></div>
            <div><span className="aiv-num">Top {data.percentileTop}%</span><span className="aiv-lab">of all listings</span></div>
          </div>
          {data.citations === 0 ? (
            <p className="aiv-callout">Your listing isn&rsquo;t appearing in AI answers yet. AI engines surface companies with complete, verified, well-reviewed profiles — the steps below move the needle fastest.</p>
          ) : (
            <p className="aiv-callout aiv-callout--good">You&rsquo;re being cited by AI search — nicely done. Keep your profile complete and reviews fresh to climb the ranking.</p>
          )}
        </div>
      </div>

      {data.prompts.length > 0 && (
        <div className="aiv-prompts">
          <span className="aiv-sub">AI prompts relevant to you</span>
          <ul>
            {data.prompts.map((p, i) => (
              <li key={i}>
                <span className={`aiv-flag ${p.mentioned ? "yes" : "no"}`}>{p.mentioned ? "✓ Mentioned" : "Not mentioned"}</span>
                <span className="aiv-q">{p.q}</span>
                {!p.mentioned && p.oohsource && <span className="aiv-note">OOHsource is cited here — a complete listing gets you named</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="aiv-actions">
        <span className="aiv-sub">How to increase your AI visibility</span>
        <div className="aiv-action-grid">
          <a className="aiv-action" href={`/directory/${vendor.slug}`}>
            <strong>Complete your profile</strong>
            <span>Full descriptions + photos appear in AI answers 3&times; more often. Edit yours below.</span>
          </a>
          <a className="aiv-action" href={`/directory/${vendor.slug}`}>
            <strong>Collect reviews</strong>
            <span>Well-reviewed listings get cited ~2&times; more. Point customers to your profile.</span>
          </a>
          {vendor.tier !== "Featured" && (
            <a className="aiv-action" href="/pricing">
              <strong>Go Featured</strong>
              <span>Featured listings rank above competitors in the directory AI reads.</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
