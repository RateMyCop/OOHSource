export function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

export function domainFromEmail(email: string): string {
  const at = email.indexOf("@");
  return at >= 0 ? email.slice(at + 1).trim().toLowerCase() : "";
}

// True when the email's domain plausibly belongs to the company website
// (exact match, or one is a subdomain of the other).
export function emailMatchesSite(email: string, website: string): boolean {
  const e = domainFromEmail(email);
  const s = domainFromUrl(website);
  if (!e || !s) return false;
  return e === s || e.endsWith("." + s) || s.endsWith("." + e);
}
