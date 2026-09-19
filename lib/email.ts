import { isSuppressed, makeUnsubToken, recordOutreachSent } from "./outreach";
import { kv } from "./kv";

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
  headers?: Record<string, string>,
  scheduledAt?: string
): Promise<void> {
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not set");
  const payload: Record<string, unknown> = { from, to, subject, html };
  if (replyTo) payload.reply_to = replyTo;
  if (headers) payload.headers = headers;
  // Resend natively schedules delivery when given a future ISO 8601 time.
  if (scheduledAt) payload.scheduled_at = scheduledAt;
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
  if (await isSuppressed(to)) return false;

  // ?ref=email lets us attribute which emailed vendors actually clicked through.
  const listingUrl = `${SITE_URL}/directory/${slug}?ref=email`;
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
    <p style="font-size: 12px; color: #9AA0A8; line-height: 1.5;">You&rsquo;re receiving this because ${safe} is listed in the OOHsource directory. <a href="${unsubUrl}" style="color:#9AA0A8;">Unsubscribe</a> to stop these emails.<br />OOHsource &middot; P.O. Box 3787, Alpine, WY 83128</p>`);
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
  // Durable record so future drips never re-email this address, even if local
  // recipient lists are lost.
  await recordOutreachSent(to);
  return true;
}

// "You ranked #N — here's your award badge" outreach. Sent to companies that
// place on a /best list. Returns false (without sending) if unsubscribed.
export async function sendBadgeAwardEmail(
  to: string,
  company: string,
  slug: string,
  opts: { listSlug: string; listTitle: string; badgeLabel: string; rank: number; year: number }
): Promise<boolean> {
  if (await isSuppressed(to)) return false;

  const { listSlug, listTitle, badgeLabel, rank, year } = opts;
  const profileUrl = `${SITE_URL}/directory/${slug}?ref=badge-email`;
  const bestUrl = `${SITE_URL}/best/${listSlug}?ref=badge-email`;
  const badgeImg = `${SITE_URL}/badge/${slug}?list=${listSlug}`;
  const unsubUrl = `${SITE_URL}/api/unsubscribe?t=${makeUnsubToken(to)}`;
  const safe = escapeHtml(company);
  const safeList = escapeHtml(listTitle);
  const badgeAlt = `${safe} — ranked #${rank} in ${safeList} on OOHsource ${year}`;

  const html = wrap(`
    <p style="font-size: 16px; line-height: 1.6;">Hi ${safe},</p>
    <p style="font-size: 16px; line-height: 1.6;">Good news &mdash; <strong>${safe}</strong> ranks <strong>#${rank}</strong> in <a href="${bestUrl}" style="color:#A9660E;">${safeList}</a> on <strong>OOHsource</strong>. The ranking is a transparent blend of verified Google &amp; Yelp ratings and market coverage &mdash; not pay-to-play.</p>
    <p style="margin: 22px 0; text-align:center;">
      <a href="${profileUrl}"><img src="${badgeImg}" alt="${badgeAlt}" width="270" height="96" style="border:0; max-width:100%;" /></a>
    </p>
    <p style="font-size: 16px; line-height: 1.6;">You&rsquo;re welcome to display this <strong>award badge</strong> on your site &mdash; it links back to the ranking, so it doubles as a trust mark and a backlink. Grab the one-line embed code (light or dark) from your listing:</p>
    <p style="margin: 26px 0;">
      <a href="${profileUrl}" style="background:#D98A1F; color:#1B1206; text-decoration:none; font-weight:700; padding: 12px 22px; border-radius: 4px; display:inline-block;">Get your badge code &rarr;</a>
    </p>
    <p style="font-size: 15px; line-height: 1.6;">Best,<br />The OOHsource team</p>
    <p style="font-size: 12px; color: #9AA0A8; line-height: 1.5;">You&rsquo;re receiving this because ${safe} is listed in the OOHsource directory. <a href="${unsubUrl}" style="color:#9AA0A8;">Unsubscribe</a> to stop these emails.<br />OOHsource &middot; P.O. Box 3787, Alpine, WY 83128</p>`);

  await sendEmailFrom(
    OUTREACH_FROM,
    to,
    `${company} ranked #${rank} in ${badgeLabel} on OOHsource`,
    html,
    "hello@oohsource.com",
    {
      "List-Unsubscribe": `<${unsubUrl}>, <mailto:hello@oohsource.com?subject=unsubscribe>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    }
  );
  await recordOutreachSent(to);
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

// Post-verification Featured upsell. Scheduled to land ~2 days AFTER a listing
// is verified (a high-intent moment), so it doesn't crowd the verification
// itself. One-time per email (KV dedupe), suppression-aware, CAN-SPAM compliant.
// Returns false without sending if suppressed or already nudged. Best-effort:
// callers must not let a failure here break the verification flow.
const VERIFY_NUDGE_TTL = 180 * 24 * 3600; // don't re-nudge the same owner for ~6 months
const VERIFY_NUDGE_DELAY_MS = 2 * 24 * 3600 * 1000; // deliver in ~2 days

export async function scheduleVerifiedUpgradeNudge(
  to: string,
  company: string
): Promise<boolean> {
  if (!to || (await isSuppressed(to))) return false;

  // One-time gate on a SHARED key with the pricing-page nudge, so an owner
  // never gets more than one Featured nudge across either trigger.
  const r = kv();
  if (r) {
    const first = await r.set(`featnudge:${to.toLowerCase()}`, "1", {
      nx: true,
      ex: VERIFY_NUDGE_TTL,
    });
    if (!first) return false;
  }

  const dash = `${SITE_URL}/dashboard`;
  const unsubUrl = `${SITE_URL}/api/unsubscribe?t=${makeUnsubToken(to)}`;
  const who = company ? escapeHtml(company) : "your company";
  const html = wrap(`
    <p style="font-size: 16px; line-height: 1.6;">Congrats — <strong>${who}</strong> is now <strong>Verified</strong> on OOHsource. Your listing shows the Verified badge, so buyers know it&rsquo;s genuine and company-managed.</p>
    <p style="font-size: 16px; line-height: 1.6;">Now that you&rsquo;re set up, here&rsquo;s what <strong>Featured</strong> adds:</p>
    <ul style="font-size: 15px; line-height: 1.7; padding-left: 20px;">
      <li><strong>Top of your category</strong> and priority in search</li>
      <li>The <strong>Featured</strong> badge alongside your Verified badge</li>
      <li>Homepage &amp; spotlight placement in front of buyers</li>
    </ul>
    <p style="font-size: 16px; line-height: 1.6;">OOHsource is the only major OOH directory that&rsquo;s fully public — which is why buyers <em>and</em> AI assistants (ChatGPT, Perplexity, Google&rsquo;s AI Overviews) can actually find and cite it. Featured puts ${who} first there.</p>
    <p style="font-size: 16px; line-height: 1.6;">It&rsquo;s <strong>$50/year</strong>, and you can switch it on from your dashboard in a couple of clicks.</p>
    <p style="margin: 26px 0;">
      <a href="${dash}" style="background:#D98A1F; color:#1B1206; text-decoration:none; font-weight:700; padding: 12px 22px; border-radius: 4px; display:inline-block;">See Featured &rarr;</a>
    </p>
    <p style="font-size: 15px; line-height: 1.6;">No pressure — your verified free listing stays exactly as it is either way.</p>
    <p style="font-size: 12px; color: #9AA0A8; line-height: 1.5;"><a href="${unsubUrl}" style="color:#9AA0A8;">Unsubscribe</a> from these emails.<br />OOHsource &middot; P.O. Box 3787, Alpine, WY 83128</p>`);

  const subject = company
    ? `${company} is verified on OOHsource — here's what Featured adds`
    : `You're verified on OOHsource — here's what Featured adds`;
  const scheduledAt = new Date(Date.now() + VERIFY_NUDGE_DELAY_MS).toISOString();

  await sendEmailFrom(
    OUTREACH_FROM,
    to,
    subject,
    html,
    "hello@oohsource.com",
    {
      "List-Unsubscribe": `<${unsubUrl}>, <mailto:hello@oohsource.com?subject=unsubscribe>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
    scheduledAt
  );
  return true;
}

// Contact-form notification. Sent from hello@ (which forwards to the owner
// inbox) with reply_to set to the sender, so a reply goes straight back to them.
// Not suppression-gated — this is our own inbound notification, not outreach.
export async function sendContactMessage(opts: {
  name: string;
  email: string;
  company?: string;
  topic?: string;
  message: string;
}): Promise<void> {
  const to = process.env.CONTACT_TO || "hello@oohsource.com";
  const row = (label: string, value: string) =>
    `<tr><td style="color:#71767E;padding:2px 14px 2px 0;vertical-align:top;">${label}</td><td>${value}</td></tr>`;
  const html = wrap(`
    <p style="font-size:16px;line-height:1.6;"><strong>New contact message</strong></p>
    <table style="font-size:15px;line-height:1.6;border-collapse:collapse;margin-bottom:8px;">
      ${row("Name", escapeHtml(opts.name))}
      ${row("Email", `<a href="mailto:${escapeHtml(opts.email)}" style="color:#A9660E;">${escapeHtml(opts.email)}</a>`)}
      ${opts.company ? row("Company", escapeHtml(opts.company)) : ""}
      ${opts.topic ? row("Topic", escapeHtml(opts.topic)) : ""}
    </table>
    <p style="font-size:16px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(opts.message)}</p>`);
  await sendEmailFrom(
    "OOHsource <hello@oohsource.com>",
    to,
    `Contact form${opts.topic ? ` · ${opts.topic}` : ""} — ${opts.name}`,
    html,
    opts.email
  );
}

// One-off human reply to an inbound email, sent from hello@oohsource.com.
// Replies route back to hello@ (which forwards to the owner inbox).
export async function sendReply(
  to: string,
  subject: string,
  html: string,
  replyTo = "hello@oohsource.com"
): Promise<void> {
  await sendEmailFrom("OOHsource <hello@oohsource.com>", to, subject, html, replyTo);
}

// Triggered nudge when a signed-in owner views the pricing page — a one-time
// push toward Featured. Suppression-aware; returns false if opted out.
export async function sendFeaturedNudge(
  to: string,
  company: string
): Promise<boolean> {
  if (await isSuppressed(to)) return false;
  const dash = `${SITE_URL}/dashboard`;
  const unsubUrl = `${SITE_URL}/api/unsubscribe?t=${makeUnsubToken(to)}`;
  const who = company ? escapeHtml(company) : "your listing";
  const html = wrap(`
    <p style="font-size: 16px; line-height: 1.6;">Hi there,</p>
    <p style="font-size: 16px; line-height: 1.6;">A quick note on why <strong>Featured</strong> is worth it for <strong>${who}</strong>.</p>
    <p style="font-size: 16px; line-height: 1.6;">OOHsource is the only major out-of-home directory that&rsquo;s <strong>fully public</strong> &mdash; not locked behind a login or paywall like the rest. That&rsquo;s exactly why search engines and AI assistants (ChatGPT, Perplexity, Google&rsquo;s AI Overviews) can actually crawl and cite it. We built it to be <strong>LLM- and AI-optimized</strong> from the ground up.</p>
    <p style="font-size: 16px; line-height: 1.6;"><strong>Featured</strong> puts ${who} at the top of the one OOH directory that buyers <em>and</em> AI models read first:</p>
    <ul style="font-size: 15px; line-height: 1.7; padding-left: 20px;">
      <li>Top placement in your category</li>
      <li>The <strong>Featured</strong> &amp; <strong>Verified</strong> badges</li>
      <li>Priority everywhere buyers and AI look</li>
    </ul>
    <p style="font-size: 16px; line-height: 1.6;">It&rsquo;s <strong>$50/year</strong>, and you can turn it on from your dashboard in a couple of clicks.</p>
    <p style="margin: 26px 0;">
      <a href="${dash}" style="background:#D98A1F; color:#1B1206; text-decoration:none; font-weight:700; padding: 12px 22px; border-radius: 4px; display:inline-block;">Go Featured &rarr;</a>
    </p>
    <p style="font-size: 15px; line-height: 1.6;">No rush &mdash; your free listing stays exactly as it is either way.</p>
    <p style="font-size: 12px; color: #9AA0A8; line-height: 1.5;"><a href="${unsubUrl}" style="color:#9AA0A8;">Unsubscribe</a> from these emails.<br />OOHsource &middot; P.O. Box 3787, Alpine, WY 83128</p>`);
  await sendEmailFrom(
    OUTREACH_FROM,
    to,
    `Ready to feature ${company || "your company"} on OOHsource?`,
    html,
    "hello@oohsource.com",
    {
      "List-Unsubscribe": `<${unsubUrl}>, <mailto:hello@oohsource.com?subject=unsubscribe>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    }
  );
  return true;
}
