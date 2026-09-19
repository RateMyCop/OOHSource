import { redirect } from "next/navigation";
import { getSessionEmail, isAdmin } from "@/lib/auth";
import { ownedSlugsForEmail } from "@/lib/owner";
import { getVendorBySlug } from "@/lib/vendors";
import { DashboardNav } from "@/components/DashboardNav";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const email = getSessionEmail();
  if (!email) redirect("/login");

  let primary: string | null = null;
  let companyName = "";
  try {
    const slugs = await ownedSlugsForEmail(email);
    primary = slugs[0] || null;
    if (primary) {
      const v = await getVendorBySlug(primary);
      companyName = v?.name || "";
    }
  } catch {
    /* nav still renders with fallbacks */
  }

  return (
    <div className="dash-shell">
      <DashboardNav
        primarySlug={primary}
        companyName={companyName}
        email={email}
        admin={isAdmin(email)}
      />
      <div className="dash-main">{children}</div>
    </div>
  );
}
