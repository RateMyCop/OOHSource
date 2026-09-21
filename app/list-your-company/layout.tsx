import type { Metadata } from "next";
import { SITE_URL } from "@/lib/lists";

export const metadata: Metadata = {
  title: "List Your Company in the OOH Directory — Free",
  description:
    "Add your out-of-home company to the OOHsource directory — free. Media owners, agencies, printers, installers, and DOOH technology welcome.",
  alternates: { canonical: `${SITE_URL}/list-your-company` },
};

export default function ListYourCompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
