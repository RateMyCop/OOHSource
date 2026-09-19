import { kv } from "./kv";

// Buyer inquiries ("Contact this company") captured on a public profile and
// shown to the owner in their dashboard Leads tab. KV-backed; writes only ever
// happen in API routes (runtime), reads in dynamic dashboard pages.

export type Lead = {
  id: string;
  slug: string;
  name: string;
  email: string;
  company?: string;
  message: string;
  created: string;
  read: boolean;
};

const idxKey = (slug: string) => `leads:${slug}`;

function newId(): string {
  return "ld_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export async function createLead(input: {
  slug: string;
  name: string;
  email: string;
  company?: string;
  message: string;
}): Promise<Lead | null> {
  const r = kv();
  if (!r) return null;
  const lead: Lead = {
    id: newId(),
    slug: input.slug,
    name: input.name,
    email: input.email,
    company: input.company,
    message: input.message,
    created: new Date().toISOString(),
    read: false,
  };
  await Promise.all([
    r.set(`lead:${lead.id}`, lead),
    r.sadd(idxKey(lead.slug), lead.id),
  ]);
  return lead;
}

export async function listLeadsForSlug(slug: string): Promise<Lead[]> {
  const r = kv();
  if (!r) return [];
  const ids = ((await r.smembers(idxKey(slug))) as string[]) || [];
  if (!ids.length) return [];
  const rows = (await r.mget<(Lead | null)[]>(...ids.map((id) => `lead:${id}`))) || [];
  return rows.filter((x): x is Lead => Boolean(x)).sort((a, b) => (a.created < b.created ? 1 : -1));
}

export async function getLead(id: string): Promise<Lead | null> {
  const r = kv();
  if (!r) return null;
  return ((await r.get(`lead:${id}`)) as Lead | null) || null;
}

export async function markLeadRead(id: string): Promise<void> {
  const r = kv();
  if (!r) return;
  const lead = (await r.get(`lead:${id}`)) as Lead | null;
  if (!lead || lead.read) return;
  lead.read = true;
  await r.set(`lead:${id}`, lead);
}
