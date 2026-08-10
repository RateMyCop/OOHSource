import { ClaimRow, fetchClaimsByEmail } from "./airtable";

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

export function authorizedSlugs(claims: ClaimRow[]): string[] {
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
