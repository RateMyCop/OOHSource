"use client";

import { useState } from "react";

const ORIGIN = "https://oohsource.com";

export function BadgeEmbed({ slug, name }: { slug: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [copied, setCopied] = useState(false);

  const badgeUrl = `${ORIGIN}/badge/${slug}${dark ? "?theme=dark" : ""}`;
  const profileUrl = `${ORIGIN}/directory/${slug}?ref=badge`;
  const alt = `${name} — on OOHsource, the global out-of-home directory`;
  const snippet = `<a href="${profileUrl}" target="_blank" rel="noopener">
  <img src="${badgeUrl}" alt="${alt}" width="214" height="66" loading="lazy" />
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
        {open ? "− Hide badge" : "Add this badge to your site →"}
      </button>

      {open && (
        <div className="badge-embed-body">
          <div className="badge-embed-preview" data-dark={dark}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={badgeUrl} alt={alt} width={214} height={66} />
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
