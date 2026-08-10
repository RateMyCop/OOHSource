const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "OOHsource <verify@oohsource.com>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://oohsource.com";

export function emailConfigured(): boolean {
  return Boolean(RESEND_API_KEY);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not set");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: EMAIL_FROM, to, subject, html }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Resend send failed ${res.status}: ${await res.text()}`);
  }
}

function wrap(bodyHtml: string): string {
  return `<div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; padding: 28px 24px; color: #17191E;">
    <div style="font-size: 20px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 22px;">
      <span style="color:#17191E;">OOH</span><span style="color:#A9660E;">source</span>
    </div>
    ${bodyHtml}
    <hr style="border:none; border-top:1px solid #E2E4DE; margin: 28px 0 16px;" />
    <div style="font-size: 12px; color: #9AA0A8;">OOHsource — the global out-of-home directory · oohsource.com</div>
  </div>`;
}

export async function sendVerificationEmail(
  to: string,
  companyName: string,
  token: string
): Promise<void> {
  const url = `${SITE_URL}/verify?token=${encodeURIComponent(token)}`;
  const html = wrap(`
    <p style="font-size: 16px; line-height: 1.55;">Thanks for submitting <strong>${escapeHtml(
      companyName
    )}</strong> to the OOHsource directory.</p>
    <p style="font-size: 16px; line-height: 1.55;">Confirm your email to send the listing for review:</p>
    <p style="margin: 26px 0;">
      <a href="${url}" style="background:#D98A1F; color:#1B1206; text-decoration:none; font-weight:700; padding: 12px 22px; border-radius: 4px; display:inline-block;">Confirm your listing &rarr;</a>
    </p>
    <p style="font-size: 13px; color: #71767E; line-height: 1.55;">If you didn&rsquo;t submit this, you can safely ignore this email.</p>`);
  await sendEmail(to, "Confirm your OOHsource listing", html);
}

export async function sendLoginEmail(to: string, token: string): Promise<void> {
  const url = `${SITE_URL}/api/auth/callback?token=${encodeURIComponent(token)}`;
  const html = wrap(`
    <p style="font-size: 16px; line-height: 1.55;">Here&rsquo;s your secure sign-in link for the OOHsource owner dashboard:</p>
    <p style="margin: 26px 0;">
      <a href="${url}" style="background:#D98A1F; color:#1B1206; text-decoration:none; font-weight:700; padding: 12px 22px; border-radius: 4px; display:inline-block;">Sign in to your dashboard &rarr;</a>
    </p>
    <p style="font-size: 13px; color: #71767E; line-height: 1.55;">This link works once and expires in 20 minutes. If you didn&rsquo;t request it, you can safely ignore this email.</p>`);
  await sendEmail(to, "Your OOHsource sign-in link", html);
}

export async function sendClaimVerificationEmail(
  to: string,
  companyName: string,
  token: string
): Promise<void> {
  const url = `${SITE_URL}/verify?type=claim&token=${encodeURIComponent(token)}`;
  const html = wrap(`
    <p style="font-size: 16px; line-height: 1.55;">You requested to claim the listing for <strong>${escapeHtml(
      companyName
    )}</strong> on OOHsource.</p>
    <p style="font-size: 16px; line-height: 1.55;">Confirm your email to send your claim for review:</p>
    <p style="margin: 26px 0;">
      <a href="${url}" style="background:#D98A1F; color:#1B1206; text-decoration:none; font-weight:700; padding: 12px 22px; border-radius: 4px; display:inline-block;">Confirm your claim &rarr;</a>
    </p>
    <p style="font-size: 13px; color: #71767E; line-height: 1.55;">If you didn&rsquo;t request this, you can safely ignore this email.</p>`);
  await sendEmail(to, "Confirm your OOHsource listing claim", html);
}
