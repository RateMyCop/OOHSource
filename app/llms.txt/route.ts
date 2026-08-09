import { CATEGORIES } from "@/lib/data";
import { getAllVendors } from "@/lib/vendors";
import { LISTS, SITE_URL } from "@/lib/lists";

export const revalidate = 3600;

// /llms.txt — an LLM-friendly map of the site (llmstxt.org convention).
export async function GET() {
  const vendors = await getAllVendors();

  const lines: string[] = [];
  lines.push("# OOHsource");
  lines.push("");
  lines.push(
    "> OOHsource is the neutral, vetted directory of the global out-of-home (OOH) advertising industry — media owners, agencies, printers, installers, and the technology behind them. Every listing has a factual, source-grounded description and, where available, verified Google and Yelp ratings."
  );
  lines.push("");
  lines.push(
    `The directory currently lists ${vendors.length} companies across ${CATEGORIES.length} categories. Listings are free; a paid Featured tier provides top placement.`
  );
  lines.push("");

  lines.push("## Categories");
  for (const c of CATEGORIES) {
    lines.push(`- [${c.name}](${SITE_URL}/category/${c.slug}): ${c.blurb}`);
  }
  lines.push("");

  lines.push("## Ranked lists (Top 10s)");
  for (const l of LISTS) {
    lines.push(`- [${l.title}](${SITE_URL}/best/${l.slug})`);
  }
  lines.push("");

  lines.push("## Key pages");
  lines.push(`- [Full directory](${SITE_URL}/directory)`);
  lines.push(`- [Pricing](${SITE_URL}/pricing)`);
  lines.push(`- [List your company](${SITE_URL}/list-your-company)`);
  lines.push(`- [Sitemap](${SITE_URL}/sitemap.xml)`);
  lines.push("");

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
