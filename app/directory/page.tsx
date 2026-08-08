import type { Metadata } from "next";
import { CATEGORIES, VENDORS } from "@/lib/data";
import { DirectoryClient } from "./DirectoryClient";

export const metadata: Metadata = {
  title: "Directory — OOHsource",
  description:
    "Search the global out-of-home directory by category, format, and market. Media owners, agencies, printers, installers, and OOH technology.",
};

export default function DirectoryPage() {
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
        <DirectoryClient vendors={VENDORS} categories={CATEGORIES} />
      </div>
    </>
  );
}
