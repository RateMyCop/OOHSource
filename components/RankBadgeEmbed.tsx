"use client";

import { useState } from "react";

const ORIGIN = "https://oohsource.com";

// Embeddable award / rank badge for a company that places on a "Best of" list.
// Links back to the ranking page so visitors can see the list (and the company's
// position) — a strong third-party trust signal + dofollow backlink.
export function RankBadgeEmbed({
  slug,
  name,
  listSlug,
  listTitle,
  rank,
  year,
}: {
  slug: string;
  name: string;
  listSlug: string;
  listTitle: string;
  rank: number;
  year: number;
}) {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [copied, setCopied] = useState(false);

  const badgeUrl = `${ORIGIN}/badge/${slug}?list=${listSlug}${
    dark ? "&theme=dark" : ""
  }`;
  const linkUrl = `${ORIGIN}/best/${listSlug}?ref=badge`;
  const alt = `${name} — ranked #${rank} in ${listTitle} on OOHsource ${year}`;
  const snippet = `<a href="${linkUrl}" target="_blank" rel="noopener">
  <img src="${badgeUrl}" alt="${alt}" width="270" height="96" loading="lazy" />
</a>`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — user can select manually */
    }
  }

  return (
    <div className="badge-embed">
      <button
        type="button"
        className="badge-embed-toggle"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? "− Hide award badge" : "Get your award badge →"}
      </button>

      {open && (
        <div className="badge-embed-body">
          <div className="badge-embed-preview" data-dark={dark}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={badgeUrl} alt={alt} width={270} height={96} />
          </div>

          <div className="badge-embed-row">
            <span className="badge-embed-label">Style</span>
            <div className="badge-embed-themes">
              <button
                type="button"
                className={!dark ? "on" : ""}
                onClick={() => setDark(false)}
              >
                Light
              </button>
              <button
                type="button"
                className={dark ? "on" : ""}
                onClick={() => setDark(true)}
              >
                Dark
              </button>
            </div>
          </div>

          <textarea
            className="badge-embed-code"
            readOnly
            rows={4}
            value={snippet}
            onFocus={(e) => e.currentTarget.select()}
          />
          <button type="button" className="badge-embed-copy" onClick={copy}>
            {copied ? "✓ Copied" : "Copy embed code"}
          </button>
        </div>
      )}
    </div>
  );
}
