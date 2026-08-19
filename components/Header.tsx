import Link from "next/link";
import { NavLinks } from "./NavLinks";

export function Header() {
  return (
    <header className="site">
      <div className="wrap nav">
        <Link className="brand" href="/" aria-label="OOHsource home">
          <span className="mark" aria-hidden="true" />
          <span className="ooh">OOH</span>
          <span className="src">source</span>
        </Link>
        <NavLinks />
      </div>
    </header>
  );
}
