import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="site">
      <div className="wrap nav">
        <Link className="brand" href="/" aria-label="OOHsource home">
          <span className="mark" aria-hidden="true" />
          <span className="ooh">OOH</span>
          <span className="src">source</span>
        </Link>
        <nav className="nav-links" aria-label="Primary">
          <Link className="navlink" href="/directory">
            Directory
          </Link>
          <Link className="navlink" href="/agencies">
            Agencies
          </Link>
          <Link className="navlink" href="/vendors">
            Vendors
          </Link>
          <Link className="navlink" href="/pricing">
            Pricing
          </Link>
          <ThemeToggle />
          <Link className="btn btn--primary btn--sm" href="/list-your-company">
            List your company
          </Link>
        </nav>
      </div>
    </header>
  );
}
