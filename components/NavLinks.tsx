"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

const LINKS: { href: string; label: string }[] = [
  { href: "/directory", label: "Directory" },
  { href: "/best", label: "Best of" },
  { href: "/agencies", label: "Agencies" },
  { href: "/vendors", label: "Vendors" },
  { href: "/pricing", label: "Pricing" },
  { href: "/login", label: "Sign in" },
];

export function NavLinks() {
  const pathname = usePathname() || "/";
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="nav-links" aria-label="Primary">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          className="navlink"
          href={l.href}
          aria-current={isActive(l.href) ? "page" : undefined}
        >
          {l.label}
        </Link>
      ))}
      <ThemeToggle />
      <Link className="btn btn--primary btn--sm" href="/list-your-company">
        List your company
      </Link>
    </nav>
  );
}
