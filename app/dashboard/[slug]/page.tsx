import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// The per-listing manage view is now tab panels under /dashboard. Redirect any
// old links (and the editor anchors) into the tabbed dashboard.
export default function ManageListingRedirect({
  params,
}: {
  params: { slug: string };
}) {
  redirect(`/dashboard?tab=edit&slug=${params.slug}`);
}
