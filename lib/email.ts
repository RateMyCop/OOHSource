import { isUnsubscribed, makeUnsubToken } from "./outreach";

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

// Lower-level send that allows a custom From and Reply-To (used for outreach,
// which must NOT go out as the transactional verify@ sender).
async function sendEmailFrom(
  from: string,
  to: string,
  subject: string,
  html: string,
  replyTo?: string,
  headers?: Record<string, string>
): Promise<void> {
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not set");
  const payload: Record<string, unknown> = { from, to, subject, html };
  if (replyTo) payload.reply_to = replyTo;
  if (headers) payload.headers = headers;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Resend send failed ${res.status}: ${await res.text()}`);
  }
}

const OUTREACH_FROM = process.env.OUTREACH_FROM || "OOHsource <hello@oohsource.com>";

// "You're listed — claim your free profile" outreach email. Returns false
// (without sending) if the recipient has unsubscribed.
export async function sendOutreachEmail(
  to: string,
  company: string,
  slug: string
): Promise<boolean> {
  if (await isUnsubscribed(to)) return false;

  const listingUrl = `${SITE_URL}/directory/${slug}`;
  const unsubUrl = `${SITE_URL}/api/unsubscribe?t=${makeUnsubToken(to)}`;
  const safe = escapeHtml(company);
  const html = wrap(`
    <p style="font-size: 16px; line-height: 1.6;">Hi ${safe},</p>
    <p style="font-size: 16px; line-height: 1.6;">We&rsquo;ve added <strong>${safe}</strong> to <strong>OOHsource</strong>, the new global directory for the out-of-home advertising industry &mdash; media owners, agencies, printers, installers, and the tech behind them.</p>
    <p style="font-size: 16px; line-height: 1.6;">Your listing is live here:<br /><a href="${listingUrl}" style="color:#A9660E;">${listingUrl}</a></p>
    <p style="font-size: 16px; line-height: 1.6;">It&rsquo;s <strong>free</strong>. Claim it to manage your details, add photos, and see how many buyers are viewing and contacting you.</p>
    <p style="margin: 26px 0;">
      <a href="${listingUrl}" style="background:#D98A1F; color:#1B1206; text-decoration:none; font-weight:700; padding: 12px 22px; border-radius: 4px; display:inline-block;">Claim your listing &rarr;</a>
    </p>
    <p style="font-size: 15px; line-height: 1.6;">Best,<br />The OOHsource team</p>
    <p style="font-size: 12px; color: #9AA0A8; line-height: 1.5;">You&rsquo;re receiving this because ${safe} is listed in the OOHsource directory. <a href="${unsubUrl}" style="color:#9AA0A8;">Unsubscribe</a> to stop these emails.</p>`);
  await sendEmailFrom(
    OUTREACH_FROM,
    to,
    `${company} is now listed on OOHsource`,
    html,
    "hello@oohsource.com",
    {
      "List-Unsubscribe": `<${unsubUrl}>, <mailto:hello@oohsource.com?subject=unsubscribe>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    }
  );
  return true;
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

export async function sendLoginCode(to: string, code: string): Promise<void> {
  const html = wrap(`
    <p style="font-size: 16px; line-height: 1.55;">Your OOHsource sign-in code:</p>
    <p style="font-size: 34px; font-weight: 800; letter-spacing: 8px; margin: 22px 0; color: #17191E;">${escapeHtml(code)}</p>
    <p style="font-size: 13px; color: #71767E; line-height: 1.55;">Enter this code on the sign-in page. It expires in 10 minutes. If you didn&rsquo;t request it, you can safely ignore this email.</p>`);
  await sendEmail(to, `${code} is your OOHsource sign-in code`, html);
}

export async function sendLoginEmail(to: string, token: string): Promise<void> {
  // Link lands on a confirm page (not a side-effecting endpoint) so email
  // security scanners that pre-fetch links don't consume the one-time token.
  const url = `${SITE_URL}/login/verify?token=${encodeURIComponent(token)}`;
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
