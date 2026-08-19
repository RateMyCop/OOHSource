// Small "ⓘ" affordance with an accessible, CSS-only tooltip (shows on hover
// AND keyboard focus). No "use client" — it's pure markup, so it works inside
// both server components (the vendor badge) and client ones (the directory filter).
export function InfoTip({ label }: { label: string }) {
  return (
    <span className="vtip" tabIndex={0} aria-label={label}>
      <span className="vtip-mark" aria-hidden="true">
        i
      </span>
      <span className="vtip-pop" aria-hidden="true">
        {label}
      </span>
    </span>
  );
}
