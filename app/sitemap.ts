import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/data";
import { getAllVendors } from "@/lib/vendors";
import { LISTS, SITE_URL } from "@/lib/lists";
import { FORMAT_TYPES } from "@/lib/formats";
import { PUBLICATIONS } from "@/lib/publications";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const vendors = await getAllVendors();

  const staticPages = [
    "",
    "/directory",
    "/pricing",
    "/agencies",
    "/vendors",
    "/best",
    "/formats",
    "/publications",
    "/list-your-company",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const categoryPages = CATEGORIES.map((c) => ({
    url: `${SITE_URL}/category/${c.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const listPages = LISTS.map((l) => ({
    url: `${SITE_URL}/best/${l.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const formatPages = FORMAT_TYPES.map((f) => ({
    url: `${SITE_URL}/formats/${f.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const vendorPages = vendors.map((v) => ({
    url: `${SITE_URL}/directory/${v.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const publicationPages = PUBLICATIONS.map((p) => ({
    url: `${SITE_URL}/publications/${p.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [
    ...staticPages,
    ...categoryPages,
    ...listPages,
    ...formatPages,
    ...publicationPages,
    ...vendorPages,
  ];
}
