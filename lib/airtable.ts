import { Vendor, CategorySlug } from "./types";
import { CATEGORIES } from "./data";

const TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE = process.env.AIRTABLE_TABLE_NAME || "Vendors";

export function airtableConfigured(): boolean {
  return Boolean(TOKEN && BASE_ID);
}

// Map the human category name (stored in Airtable) back to our slug.
const NAME_TO_SLUG: Record<string, CategorySlug> = CATEGORIES.reduce(
  (acc, c) => {
    acc[c.name.toLowerCase()] = c.slug;
    return acc;
  },
  {} as Record<string, CategorySlug>
);

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Airtable multi-select fields come back as arrays; text fields as strings.
function toArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x));
  if (typeof v === "string")
    return v
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  return [];
}

function mapRecord(fields: Record<string, unknown>): Vendor | null {
  const name = (fields.Name ?? fields.name) as string | undefined;
  if (!name) return null;

  const categoryName = String(fields.Category ?? "");
  const categorySlug =
    NAME_TO_SLUG[categoryName.toLowerCase()] ??
    (slugify(categoryName) as CategorySlug);

  const slugField = fields.Slug ? String(fields.Slug).trim() : "";
  const slug = slugField || slugify(String(name));

  // Logo: accept a URL string, or an Airtable attachment array ([{ url }]).
  let logo = "";
  const logoField = fields.Logo;
  if (typeof logoField === "string") {
    logo = logoField.trim();
  } else if (Array.isArray(logoField) && logoField.length > 0) {
    const first = logoField[0] as { url?: unknown };
    if (typeof first?.url === "string") logo = first.url;
  }

  const tierRaw = String(fields.Tier ?? "Free");
  const tier = (["Free", "Premium", "Featured"].includes(tierRaw)
    ? tierRaw
    : "Free") as Vendor["tier"];

  return {
    slug,
    name: String(name),
    categorySlug,
    subcategory: String(fields.Subcategory ?? ""),
    formats: toArray(fields.Formats),
    location: String(fields.Location ?? ""),
    coverage: String(fields.Coverage ?? ""),
    website: String(fields.Website ?? ""),
    logo,
    phone: String(fields.Phone ?? ""),
    address: String(fields.Address ?? ""),
    marketsServed: toArray(fields["Markets Served"]),
    description: String(fields.Description ?? ""),
    specialties: toArray(fields.Specialties),
    tier,
    verified: Boolean(fields.Verified),
  };
}

interface AirtableRecord {
  fields?: Record<string, unknown>;
}

export async function fetchAirtableVendors(): Promise<Vendor[]> {
  const base = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(
    TABLE
  )}`;
  const out: Vendor[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(base);
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${TOKEN}` },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      throw new Error(`Airtable responded ${res.status}: ${await res.text()}`);
    }

    const data = (await res.json()) as {
      records?: AirtableRecord[];
      offset?: string;
    };

    for (const rec of data.records ?? []) {
      const f = rec.fields ?? {};
      // Moderation gate: hide any record whose Status is set to something other
      // than "Published". New submissions land as "Pending Review" (hidden);
      // existing rows with no Status stay visible.
      const status = String(f.Status ?? "").trim().toLowerCase();
      if (status && status !== "published") {
        continue;
      }
      const v = mapRecord(f);
      if (v) out.push(v);
    }

    offset = data.offset;
  } while (offset);

  return out;
}

// Create a single record. Defaults to the Vendors table; pass a tableName to
// write elsewhere (e.g. "Reports"). Uses typecast so string values can be
// written to single/multi-select fields (Airtable creates options as needed).
export async function createAirtableRecord(
  fields: Record<string, unknown>,
  tableName: string = TABLE
): Promise<void> {
  if (!TOKEN || !BASE_ID) throw new Error("Airtable is not configured");
  const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(
    tableName
  )}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ records: [{ fields }], typecast: true }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(
      `Airtable create failed ${res.status}: ${await res.text()}`
    );
  }
}
