import Link from "next/link";
import { NavLinks } from "./NavLinks";

export function Header() {
  return (
    <header className="site">
      <div className="wrap nav">
        <Link className="brand" href="/" aria-label="OOHsource home">
          <svg className="brand-mark" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="7.4" fill="none" stroke="currentColor" strokeWidth="2.3" />
            <circle cx="12" cy="4" r="2.5" fill="var(--accent)" />
          </svg>
          <span className="ooh">OOH</span>
          <span className="src">source</span>
        </Link>
        <NavLinks />
      </div>
    </header>
  );
}
