import { Vendor, CategorySlug } from "./types";
import { CATEGORIES } from "./data";

const TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE = process.env.AIRTABLE_TABLE_NAME || "Vendors";
const CLAIMS_TABLE = process.env.AIRTABLE_CLAIMS_TABLE || "Claims";

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
function numOrUndef(v: unknown): number | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

// Gallery accepts an Airtable attachment array ([{ url }]) or a delimited
// text field (URLs separated by newlines or commas).
function galleryFrom(field: unknown): string[] {
  if (Array.isArray(field)) {
    return field
      .map((x) =>
        typeof x === "string"
          ? x
          : typeof (x as { url?: unknown })?.url === "string"
          ? (x as { url: string }).url
          : ""
      )
      .filter(Boolean);
  }
  return String(field ?? "")
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter((u) => /^https?:\/\//i.test(u));
}

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

  // Only two tiers now: Featured (paid) and Free. Any legacy value (e.g.
  // "Premium") collapses to Free.
  const tierRaw = String(fields.Tier ?? "Free");
  const tier = (tierRaw === "Featured" ? "Featured" : "Free") as Vendor["tier"];

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
    heroImage: String(fields["Hero Image"] ?? ""),
    gallery: galleryFrom(fields.Gallery),
    x: String(fields.X ?? ""),
    facebook: String(fields.Facebook ?? ""),
    instagram: String(fields.Instagram ?? ""),
    youtube: String(fields.YouTube ?? ""),
    linkedin: String(fields.LinkedIn ?? ""),
    contactEmail: String(fields["Contact Email"] ?? ""),
    googleRating: numOrUndef(fields["Google Rating"]),
    googleReviews: numOrUndef(fields["Google Reviews"]),
    yelpRating: numOrUndef(fields["Yelp Rating"]),
    yelpReviews: numOrUndef(fields["Yelp Reviews"]),
    facebookRating: numOrUndef(fields["Facebook Rating"]),
    facebookReviews: numOrUndef(fields["Facebook Reviews"]),
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

// Fetch a map of Slug -> record id for all Vendors (only the Slug field).
export async function fetchVendorIdMap(): Promise<Record<string, string>> {
  if (!TOKEN || !BASE_ID) throw new Error("Airtable is not configured");
  const base = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(
    TABLE
  )}`;
  const map: Record<string, string> = {};
  let offset: string | undefined;
  do {
    const url = new URL(base);
    url.searchParams.set("pageSize", "100");
    url.searchParams.set("fields[]", "Slug");
    if (offset) url.searchParams.set("offset", offset);
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${TOKEN}` },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Airtable list failed ${res.status}: ${await res.text()}`);
    }
    const data = (await res.json()) as {
      records?: { id: string; fields?: { Slug?: string } }[];
      offset?: string;
    };
    for (const r of data.records ?? []) {
      const slug = r.fields?.Slug ? String(r.fields.Slug).trim() : "";
      if (slug && r.id) map[slug] = r.id;
    }
    offset = data.offset;
  } while (offset);
  return map;
}

// Find a single Vendor record id by its Slug (targeted, unlike fetchVendorIdMap
// which pulls every row). Returns null if not found.
export async function findVendorRecordIdBySlug(
  slug: string
): Promise<string | null> {
  if (!TOKEN || !BASE_ID) return null;
  const safe = slug.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  const url = new URL(
    `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`
  );
  url.searchParams.set("filterByFormula", `{Slug}='${safe}'`);
  url.searchParams.set("maxRecords", "1");
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${TOKEN}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Airtable slug lookup failed ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { records?: { id?: string }[] };
  return data.records?.[0]?.id ?? null;
}

// Batch create records (Airtable allows 10 per POST request).
export async function createAirtableRecords(
  recordsFields: Record<string, unknown>[],
  tableName: string = TABLE
): Promise<number> {
  if (!TOKEN || !BASE_ID) throw new Error("Airtable is not configured");
  const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(
    tableName
  )}`;
  let created = 0;
  for (let i = 0; i < recordsFields.length; i += 10) {
    const chunk = recordsFields.slice(i, i + 10).map((fields) => ({ fields }));
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ records: chunk, typecast: true }),
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(
        `Airtable batch create failed ${res.status}: ${await res.text()}`
      );
    }
    created += chunk.length;
  }
  return created;
}

// Batch update records (Airtable allows 10 per PATCH request).
export async function updateAirtableRecords(
  records: { id: string; fields: Record<string, unknown> }[],
  tableName: string = TABLE
): Promise<void> {
  if (!TOKEN || !BASE_ID) throw new Error("Airtable is not configured");
  const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(
    tableName
  )}`;
  for (let i = 0; i < records.length; i += 10) {
    const chunk = records.slice(i, i + 10);
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ records: chunk, typecast: true }),
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(
        `Airtable batch update failed ${res.status}: ${await res.text()}`
      );
    }
  }
}

// Batch delete records by id (Airtable allows 10 per DELETE request).
export async function deleteAirtableRecords(
  ids: string[],
  tableName: string = TABLE
): Promise<number> {
  if (!TOKEN || !BASE_ID) throw new Error("Airtable is not configured");
  let deleted = 0;
  for (let i = 0; i < ids.length; i += 10) {
    const chunk = ids.slice(i, i + 10);
    const url = new URL(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(tableName)}`
    );
    for (const id of chunk) url.searchParams.append("records[]", id);
    const res = await fetch(url.toString(), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${TOKEN}` },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(
        `Airtable batch delete failed ${res.status}: ${await res.text()}`
      );
    }
    deleted += chunk.length;
  }
  return deleted;
}

// Create a single record. Defaults to the Vendors table; pass a tableName to
// write elsewhere (e.g. "Reports"). Uses typecast so string values can be
// written to single/multi-select fields (Airtable creates options as needed).
export async function createAirtableRecord(
  fields: Record<string, unknown>,
  tableName: string = TABLE
): Promise<string> {
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
  const data = (await res.json()) as { records?: { id?: string }[] };
  return data.records?.[0]?.id ?? "";
}

export type ClaimRow = {
  slug: string;
  company: string;
  status: string;
  domainMatch: boolean;
};

// All claims filed by a given email (case-insensitive). Used to decide which
// listings a signed-in owner may manage.
export async function fetchClaimsByEmail(email: string): Promise<ClaimRow[]> {
  if (!TOKEN || !BASE_ID) return [];
  const safe = email.toLowerCase().replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  const url = new URL(
    `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(CLAIMS_TABLE)}`
  );
  url.searchParams.set("filterByFormula", `LOWER({Claimant Email})='${safe}'`);
  url.searchParams.set("maxRecords", "50");
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${TOKEN}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Airtable claims query failed ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as {
    records?: { fields?: Record<string, unknown> }[];
  };
  return (data.records ?? [])
    .map((r) => {
      const f = r.fields ?? {};
      return {
        slug: String(f["Vendor Slug"] ?? "").trim(),
        company: String(f.Company ?? "").trim(),
        status: String(f.Status ?? "").trim(),
        domainMatch:
          String(f["Domain Match"] ?? "").trim().toLowerCase() === "yes",
      };
    })
    .filter((c) => c.slug);
}

export type ClaimFull = {
  id: string;
  company: string;
  slug: string;
  email: string;
  status: string;
  domainMatch: boolean;
  note: string;
};

// All claims (most recent first), with record ids so admin can approve them.
export async function fetchClaims(max = 100): Promise<ClaimFull[]> {
  if (!TOKEN || !BASE_ID) return [];
  const url = new URL(
    `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(CLAIMS_TABLE)}`
  );
  url.searchParams.set("pageSize", String(Math.min(max, 100)));
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${TOKEN}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Airtable claims list failed ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as {
    records?: { id: string; createdTime?: string; fields?: Record<string, unknown> }[];
  };
  return (data.records ?? [])
    .map((rec) => {
      const f = rec.fields ?? {};
      return {
        id: rec.id,
        company: String(f.Company ?? "").trim(),
        slug: String(f["Vendor Slug"] ?? "").trim(),
        email: String(f["Claimant Email"] ?? "").trim(),
        status: String(f.Status ?? "").trim(),
        domainMatch: String(f["Domain Match"] ?? "").trim().toLowerCase() === "yes",
        note: String(f.Note ?? "").trim(),
        _created: rec.createdTime || "",
      };
    })
    .sort((a, b) => (b as any)._created.localeCompare((a as any)._created))
    .map(({ _created, ...c }: any) => c as ClaimFull);
}

export async function approveClaim(id: string): Promise<void> {
  await updateAirtableRecord(id, { Status: "Approved" }, CLAIMS_TABLE);
}

// Find a record ID by its Verify Token in the given table. Returns null if none.
export async function findRecordIdByToken(
  token: string,
  tableName: string = TABLE
): Promise<string | null> {
  if (!TOKEN || !BASE_ID) return null;
  const url = new URL(
    `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(tableName)}`
  );
  url.searchParams.set("filterByFormula", `{Verify Token}='${token}'`);
  url.searchParams.set("maxRecords", "1");
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${TOKEN}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Airtable query failed ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { records?: { id?: string }[] };
  return data.records?.[0]?.id ?? null;
}

// Update fields on a record by ID in the given table.
export async function updateAirtableRecord(
  recordId: string,
  fields: Record<string, unknown>,
  tableName: string = TABLE
): Promise<void> {
  if (!TOKEN || !BASE_ID) throw new Error("Airtable is not configured");
  const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(
    tableName
  )}/${recordId}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields, typecast: true }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Airtable update failed ${res.status}: ${await res.text()}`);
  }
}
