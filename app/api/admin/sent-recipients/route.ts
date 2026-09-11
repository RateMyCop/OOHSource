import { NextResponse } from "next/server";
import { recordOutreachSent, listOutreachSent } from "@/lib/outreach";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Recovers the authoritative "already emailed" set from Resend's sent-email log
// (GET /emails) and backfills the durable KV outreach ledger. One-off / on
// demand — used to reconstruct campaign history after local lists were lost.
// Admin-key gated. Query: ?subject=<substring filter, default outreach subject>.
export async function GET(req: Request) {
  const key = (req.headers.get("x-admin-key") || "").trim();
  const configured = (process.env.ADMIN_KEY || "").trim();
  if (!configured || key !== configured) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const RESEND = (process.env.RESEND_API_KEY || "").trim();
  if (!RESEND) {
    return NextResponse.json({ ok: false, error: "RESEND_API_KEY not set" }, { status: 503 });
  }

  const url = new URL(req.url);
  const subjectFilter = (url.searchParams.get("subject") || "listed on OOHsource").toLowerCase();
  const seed = url.searchParams.get("seed") !== "0"; // default: also write to the ledger

  const recipients = new Set<string>();
  let scanned = 0;
  let pages = 0;
  let after: string | undefined;

  try {
    for (let i = 0; i < 60; i++) {
      const u = new URL("https://api.resend.com/emails");
      u.searchParams.set("limit", "100");
      if (after) u.searchParams.set("after", after);
      const res = await fetch(u.toString(), {
        headers: { Authorization: `Bearer ${RESEND}` },
        cache: "no-store",
      });
      if (!res.ok) {
        return NextResponse.json(
          { ok: false, error: `Resend list failed ${res.status}: ${(await res.text()).slice(0, 200)}` },
          { status: 502 }
        );
      }
      const json = (await res.json()) as {
        data?: { id: string; to?: string[] | string; subject?: string }[];
      };
      const data = json.data ?? [];
      if (data.length === 0) break;
      pages++;
      for (const e of data) {
        scanned++;
        const subj = String(e.subject ?? "").toLowerCase();
        if (subjectFilter && !subj.includes(subjectFilter)) continue;
        const tos = Array.isArray(e.to) ? e.to : e.to ? [e.to] : [];
        for (const t of tos) {
          const addr = String(t).toLowerCase().trim();
          if (addr) recipients.add(addr);
        }
      }
      after = data[data.length - 1]?.id;
      if (data.length < 100 || !after) break;
    }

    let seeded = 0;
    if (seed) {
      for (const addr of Array.from(recipients)) {
        await recordOutreachSent(addr);
        seeded++;
      }
    }
    const ledger = await listOutreachSent();
    return NextResponse.json({
      ok: true,
      scanned,
      pages,
      matched: recipients.size,
      seeded,
      ledgerSize: ledger.length,
      recipients: Array.from(recipients).sort(),
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
