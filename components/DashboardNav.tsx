"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = {
  label: string;
  href?: string; // absent = "Soon" (roadmap preview, not yet built)
  icon: keyof typeof ICONS;
  badge?: string;
  match?: (path: string) => boolean;
};

const ICONS = {
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  store: "M4 9V5h16v4M4 9h16M4 9v10h16V9M9 19v-5h6v5",
  star: "M12 3l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4L12 17.8 6.2 20.8l1.1-6.4L2.6 9.8l6.5-.9z",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  spark: "M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z",
  bulb: "M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7c.6.5 1 1.3 1 2.1h6c0-.8.4-1.6 1-2.1A7 7 0 0012 2z",
  tag: "M20 12l-8 8-9-9V3h8zM7.5 7.5h.01",
  chat: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
} as const;

function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

export function DashboardNav({
  primarySlug,
  companyName,
  email,
  admin,
}: {
  primarySlug: string | null;
  companyName: string;
  email: string;
  admin: boolean;
}) {
  const path = usePathname();
  const manage = primarySlug ? `/dashboard/${primarySlug}` : "/dashboard";

  const overview: Item[] = [
    { label: "Dashboard", href: "/dashboard", icon: "grid", match: (p) => p === "/dashboard" },
    { label: "Edit Profile", href: `${manage}#editor`, icon: "store", match: (p) => p.startsWith("/dashboard/") },
    { label: "Rankings & Awards", href: "/dashboard#rankings", icon: "star" },
    { label: "Reviews", icon: "chat", badge: "Soon" },
    { label: "Packages", href: "/pricing", icon: "tag" },
  ];
  const performance: Item[] = [
    { label: "Performance Analytics", href: `${manage}#analytics`, icon: "chart" },
    { label: "AI Visibility", href: `${manage}#aivis`, icon: "spark", badge: "New" },
    { label: "Engagement", href: "/dashboard#engagement", icon: "bulb" },
  ];

  const render = (it: Item) => {
    const active = it.match ? it.match(path) : false;
    const cls = `dnav-item${active ? " is-active" : ""}${it.href ? "" : " is-soon"}`;
    const inner = (
      <>
        <Icon name={it.icon} />
        <span>{it.label}</span>
        {it.badge && <span className={`dnav-badge dnav-badge--${it.badge.toLowerCase()}`}>{it.badge}</span>}
      </>
    );
    return it.href ? (
      <Link key={it.label} href={it.href} className={cls}>{inner}</Link>
    ) : (
      <span key={it.label} className={cls} aria-disabled="true">{inner}</span>
    );
  };

  return (
    <aside className="dnav">
      <div className="dnav-brand">{companyName || "Your dashboard"}</div>

      <div className="dnav-group">
        <span className="dnav-h">Overview</span>
        {overview.map(render)}
      </div>
      <div className="dnav-group">
        <span className="dnav-h">Performance</span>
        {performance.map(render)}
      </div>

      <div className="dnav-foot">
        {admin && <Link href="/admin" className="dnav-item dnav-item--sm">Admin</Link>}
        <span className="dnav-email" title={email}>{email}</span>
        <form action="/api/auth/logout" method="post">
          <button type="submit" className="dnav-signout">Sign out</button>
        </form>
      </div>
    </aside>
  );
}
