import { NextResponse } from "next/server";
import { LISTS, rankVendors } from "@/lib/lists";
import { getVendorsByCategory } from "@/lib/vendors";
import { sendBadgeAwardEmail, emailConfigured } from "@/lib/email";
import { isSuppressed } from "@/lib/outreach";

export const dynamic = "force-dynamic";

// Emails the top-N of each "Best of" list their award badge.
//   GET            -> dry run: the exact plan (who would get emailed and why not).
//   POST ?send=1   -> actually sends. Auth: x-admin-key.
// Only ranked companies WITH a contact email that haven't unsubscribed are
// mailed; recipients are de-duped and each send is recorded (recordOutreachSent),
// so re-running never double-sends.

function authed(req: Request): boolean {
  const key = (req.headers.get("x-admin-key") || "").trim();
  const configured = (process.env.ADMIN_KEY || "").trim();
  return Boolean(configured) && key === configured;
}

type Status = "ready" | "no-email" | "suppressed" | "duplicate";
type Row = {
  list: string;
  listTitle: string;
  rank: number;
  name: string;
  slug: string;
  email: string;
  status: Status;
};

async function buildPlan(): Promise<Row[]> {
  const rows: Row[] = [];
  const seen = new Set<string>();
  for (const list of LISTS) {
    const ranked = rankVendors(
      await getVendorsByCategory(list.category),
      list.limit
    );
    for (let i = 0; i < ranked.length; i++) {
      const v = ranked[i];
      const email = (v.contactEmail || "").trim().toLowerCase();
      let status: Status;
      if (!email) status = "no-email";
      else if (seen.has(email)) status = "duplicate";
      else if (await isSuppressed(email)) status = "suppressed";
      else {
        status = "ready";
        seen.add(email);
      }
      rows.push({
        list: list.slug,
        listTitle: list.title,
        rank: i + 1,
        name: v.name,
        slug: v.slug,
        email,
        status,
      });
    }
  }
  return rows;
}

function totals(rows: Row[]) {
  return {
    candidates: rows.length,
    ready: rows.filter((r) => r.status === "ready").length,
    noEmail: rows.filter((r) => r.status === "no-email").length,
    suppressed: rows.filter((r) => r.status === "suppressed").length,
    duplicate: rows.filter((r) => r.status === "duplicate").length,
  };
}

export async function GET(req: Request) {
  if (!authed(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await buildPlan();
  return NextResponse.json({
    ok: true,
    mode: "dry-run",
    emailConfigured: emailConfigured(),
    totals: totals(rows),
    rows,
  });
}

export async function POST(req: Request) {
  if (!authed(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  if (url.searchParams.get("send") !== "1") {
    return NextResponse.json(
      { error: "Pass ?send=1 to actually send. Use GET for a dry run." },
      { status: 400 }
    );
  }
  if (!emailConfigured()) {
    return NextResponse.json({ error: "RESEND_API_KEY not set" }, { status: 500 });
  }

  const rows = await buildPlan();
  const year = new Date().getUTCFullYear();
  const results: (Row & { sent: boolean; error?: string })[] = [];
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const r of rows) {
    if (r.status !== "ready") {
      skipped++;
      results.push({ ...r, sent: false });
      continue;
    }
    const list = LISTS.find((l) => l.slug === r.list)!;
    try {
      const ok = await sendBadgeAwardEmail(r.email, r.name, r.slug, {
        listSlug: list.slug,
        listTitle: list.title,
        badgeLabel: list.badgeLabel,
        rank: r.rank,
        year,
      });
      if (ok) {
        sent++;
        results.push({ ...r, sent: true });
      } else {
        skipped++;
        results.push({ ...r, sent: false, error: "suppressed-at-send" });
      }
    } catch (e) {
      failed++;
      results.push({ ...r, sent: false, error: String(e).slice(0, 200) });
    }
  }

  return NextResponse.json({ ok: true, mode: "send", sent, skipped, failed, results });
}
