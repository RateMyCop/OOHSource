"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";

const LINKS: { href: string; label: string }[] = [
  { href: "/directory", label: "Directory" },
  { href: "/best", label: "Best of" },
  { href: "/agencies", label: "Agencies" },
  { href: "/vendors", label: "Vendors" },
  { href: "/pricing", label: "Pricing" },
];

export function NavLinks() {
  const pathname = usePathname() || "/";
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  // The header is static; probe the session on the client and show "Dashboard"
  // instead of "Sign in" once we know the visitor is signed in.
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => alive && setSignedIn(Boolean(d?.signedIn)))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const auth = signedIn
    ? { href: "/dashboard", label: "Dashboard" }
    : { href: "/login", label: "Sign in" };

  return (
    <nav className="nav-links" aria-label="Primary">
      {[...LINKS, auth].map((l) => (
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
