import { fetchClaimsByEmail, fetchClaims } from "./airtable";

// Minimal shape the authorization check needs (satisfied by ClaimRow & ClaimFull).
type ClaimLike = { slug: string; status: string; domainMatch: boolean };

// Which listings may a given owner email manage?
//
// A claim grants access when either:
//   - an admin has explicitly set its Status to "Approved" / "Verified"
//     (covers legitimate owners on generic inboxes like gmail), OR
//   - the owner confirmed the claim email ("Email confirmed") AND their email
//     domain matches the company website ("Domain Match" = Yes).
//
// Everything else (pending, needs review, domain mismatch without approval)
// is treated as unverified and excluded.
const APPROVED = new Set(["approved", "verified"]);

export function authorizedSlugs(claims: ClaimLike[]): string[] {
  const out = new Set<string>();
  for (const c of claims) {
    if (!c.slug) continue;
    const status = c.status.toLowerCase();
    if (APPROVED.has(status)) out.add(c.slug);
    else if (status === "email confirmed" && c.domainMatch) out.add(c.slug);
  }
  return Array.from(out);
}

export async function ownedSlugsForEmail(email: string): Promise<string[]> {
  const claims = await fetchClaimsByEmail(email);
  return authorizedSlugs(claims);
}

// Every owner email → the listings they're authorized to manage. Used by the
// monthly report cron to iterate all owners.
export async function listAllOwners(): Promise<Map<string, string[]>> {
  const claims = await fetchClaims(500);
  const byEmail = new Map<string, ClaimLike[]>();
  for (const c of claims) {
    const email = (c.email || "").toLowerCase().trim();
    if (!email || !c.slug) continue;
    const arr = byEmail.get(email) || [];
    arr.push({ slug: c.slug, status: c.status, domainMatch: c.domainMatch });
    byEmail.set(email, arr);
  }
  const out = new Map<string, string[]>();
  for (const [email, cs] of Array.from(byEmail.entries())) {
    const slugs = authorizedSlugs(cs);
    if (slugs.length) out.set(email, slugs);
  }
  return out;
}
