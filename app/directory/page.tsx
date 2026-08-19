import type { Metadata } from "next";
import { CATEGORIES } from "@/lib/data";
import { getAllVendors } from "@/lib/vendors";
import { SITE_URL } from "@/lib/lists";
import { DirectoryClient } from "./DirectoryClient";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Directory",
  description:
    "Search the global out-of-home directory by category, format, and market. Media owners, agencies, printers, installers, and OOH technology.",
  alternates: { canonical: `${SITE_URL}/directory` },
};

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: {
    q?: string;
    category?: string;
    format?: string;
    verified?: string;
    sort?: string;
  };
}) {
  const vendors = await getAllVendors();
  const csv = (v?: string) =>
    typeof v === "string" ? v.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const initialQuery = typeof searchParams.q === "string" ? searchParams.q : "";
  const initialCategories = csv(searchParams.category);
  const initialFormats = csv(searchParams.format);
  const initialVerified = searchParams.verified === "1";
  const initialSort =
    typeof searchParams.sort === "string" ? searchParams.sort : "";

  return (
    <>
      <section className="wrap page-head">
        <div className="crumb">
          <a href="/">Home</a>
          <span>/</span>
          <span>Directory</span>
        </div>
        <h1>The out-of-home directory.</h1>
        <p className="lede">
          Every link in the OOH chain — filter by role, format, and market to
          shortlist the vendors you need.
        </p>
      </section>
      <div className="wrap">
        <DirectoryClient
          vendors={vendors}
          categories={CATEGORIES}
          initialQuery={initialQuery}
          initialCategories={initialCategories}
          initialFormats={initialFormats}
          initialVerified={initialVerified}
          initialSort={initialSort}
        />
      </div>
    </>
  );
}
