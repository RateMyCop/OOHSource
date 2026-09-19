import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionEmail, isAdmin } from "@/lib/auth";
import { getAllVendors } from "@/lib/vendors";
import { getAdminActivity } from "@/lib/stats";
import { fetchClaims, fetchPendingVendors, fetchReports } from "@/lib/airtable";
import { listBounces, listComplaints, listEmailVisits, listBadgeImpressions, listUnsubscribes } from "@/lib/outreach";
import { listPendingReviews } from "@/lib/reviews";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

const APPROVED = new Set(["approved", "verified"]);

export default async function AdminPage() {
  const email = getSessionEmail();
  if (!isAdmin(email)) redirect("/login");

  const vendors = await getAllVendors();
  const slugs = vendors.map((v) => v.slug);
  const nameBySlug = new Map(vendors.map((v) => [v.slug, v.name]));

  const [activity, visited, badgeVisited, badgeEmbeds, unsubs, bounces, complaints, claims, submissions, reports, pendingReviews] =
    await Promise.all([
      getAdminActivity(slugs, 20),
      listEmailVisits().catch(() => []),
      listEmailVisits("badge-email").catch(() => []),
      listBadgeImpressions().catch(() => []),
      listUnsubscribes().catch(() => []),
      listBounces().catch(() => []),
      listComplaints().catch(() => []),
      fetchClaims(100).catch(() => []),
      fetchPendingVendors(100).catch(() => []),
      fetchReports(50).catch(() => []),
      listPendingReviews().catch(() => []),
    ]);

  const featured = vendors.filter((v) => v.tier === "Featured").length;
  // A claim is authorized (owner can manage the listing) when it's admin-
  // Approved/Verified, or email-confirmed with a matching domain.
  const isAuthorized = (c: (typeof claims)[number]) =>
    APPROVED.has(c.status.toLowerCase()) ||
    (c.status.toLowerCase() === "email confirmed" && c.domainMatch);
  // Only surface claims that genuinely need a manual decision.
  const pending = claims.filter((c) => !isAuthorized(c));
  const verified = claims.filter(isAuthorized).slice(0, 12);
  const fmt = (iso: string) => (iso ? iso.replace("T", " ").slice(0, 16) : "—");
  const n = (x: number) => x.toLocaleString();

  return (
    <section className="wrap page-head" style={{ paddingBottom: 90 }}>
      <div className="dash-head">
        <div>
          <h1 style={{ marginBottom: 6 }}>Admin.</h1>
          <p className="hint" style={{ margin: 0 }}>Signed in as {email}</p>
        </div>
        <form action="/api/auth/logout" method="post">
          <button className="btn btn--ghost btn--sm" type="submit">Sign out</button>
        </form>
      </div>

      {/* Overview */}
      <div className="an-tiles" style={{ maxWidth: 900, marginTop: 22, gridTemplateColumns: "repeat(5, 1fr)" }}>
        <div className="an-tile"><span className="an-tile-num">{n(vendors.length)}</span><span className="an-tile-label">Listings</span></div>
        <div className="an-tile"><span className="an-tile-num">{n(featured)}</span><span className="an-tile-label">Featured</span></div>
        <div className="an-tile"><span className="an-tile-num">{n(activity.totals.view)}</span><span className="an-tile-label">Views</span></div>
        <div className="an-tile"><span className="an-tile-num">{n(activity.totals.website)}</span><span className="an-tile-label">Website clicks</span></div>
        <div className="an-tile"><span className="an-tile-num">{n(activity.totals.email)}</span><span className="an-tile-label">Email clicks</span></div>
      </div>

      {/* Pending claims — approve users */}
      <h2 className="form-section" style={{ marginTop: 40 }}>
        Pending claims <span className="opt">— {pending.length} to approve</span>
      </h2>
      {pending.length === 0 ? (
        <p className="hint">No claims waiting. Approved owners get dashboard access automatically.</p>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr><th>Company</th><th>Claimant</th><th>Domain</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {pending.map((c) => (
                <tr key={c.id}>
                  <td>
                    {c.slug ? <Link href={`/directory/${c.slug}`}>{c.company || c.slug}</Link> : c.company}
                    {c.note ? <div className="hint" style={{ marginTop: 2 }}>{c.note}</div> : null}
                  </td>
                  <td>{c.email}</td>
                  <td>{c.domainMatch ? <span className="adm-yes">match</span> : <span className="adm-no">no match</span>}</td>
                  <td>{c.status || "—"}</td>
                  <td style={{ textAlign: "right" }}>
                    <form action="/api/admin/claims/approve" method="post">
                      <input type="hidden" name="id" value={c.id} />
                      <button className="btn btn--primary btn--sm" type="submit">Approve</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pending listing submissions */}
      <h2 className="form-section" style={{ marginTop: 40 }}>
        Pending submissions <span className="opt">— {submissions.length} to review</span>
      </h2>
      {submissions.length === 0 ? (
        <p className="hint">No new listing submissions waiting.</p>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr><th>Company</th><th>Website</th><th>Submitter</th><th>Status</th><th>Submitted</th><th></th></tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.id}>
                  <td>
                    {s.name}
                    {s.category ? <div className="hint" style={{ marginTop: 2 }}>{s.category}</div> : null}
                  </td>
                  <td>{s.website ? <a href={s.website} target="_blank" rel="noopener noreferrer nofollow">{s.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}</a> : "—"}</td>
                  <td>{s.submitter || "—"}</td>
                  <td>{s.status || "—"}</td>
                  <td>{fmt(s.created)}</td>
                  <td style={{ textAlign: "right" }}>
                    <form action="/api/admin/vendors/publish" method="post">
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="slug" value={s.slug} />
                      <button className="btn btn--primary btn--sm" type="submit">Publish</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Latest verified accounts */}
      <h2 className="form-section" style={{ marginTop: 40 }}>
        Latest verified accounts <span className="opt">— {verified.length}</span>
      </h2>
      {verified.length === 0 ? (
        <p className="hint">No verified owner accounts yet.</p>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Company</th><th>Owner email</th><th>Status</th><th>Verified</th></tr></thead>
            <tbody>
              {verified.map((c) => (
                <tr key={c.id}>
                  <td>{c.slug ? <Link href={`/directory/${c.slug}`}>{c.company || c.slug}</Link> : c.company}</td>
                  <td>{c.email}</td>
                  <td>{c.status}</td>
                  <td>{fmt(c.created)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reported issues / changes people submit */}
      <h2 className="form-section" style={{ marginTop: 40 }}>
        Reported issues <span className="opt">— {reports.length}</span>
      </h2>
      {reports.length === 0 ? (
        <p className="hint">No issues or change requests submitted.</p>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Listing</th><th>Type</th><th>Details</th><th>From</th><th>When</th></tr></thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td>{r.slug ? <Link href={`/directory/${r.slug}`}>{r.vendor || r.slug}</Link> : r.vendor || "—"}</td>
                  <td>{r.type || "—"}</td>
                  <td style={{ maxWidth: 340 }}>{r.details || "—"}</td>
                  <td>{r.reporter || "—"}</td>
                  <td>{fmt(r.created)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reviews to moderate */}
      <h2 id="reviews" className="form-section" style={{ marginTop: 40 }}>
        Reviews to moderate <span className="opt">— {pendingReviews.length}</span>
      </h2>
      {pendingReviews.length === 0 ? (
        <p className="hint">No reviews waiting.</p>
      ) : (
        <div>
          {pendingReviews.map((r) => (
            <div key={r.id} className="adm-rev">
              <div className="adm-rev-top">
                <span className="rev-stars">
                  {"★★★★★".slice(0, r.rating)}
                  <span className="rev-stars-off">{"★★★★★".slice(r.rating)}</span>
                </span>
                <span className="hint">
                  {r.name}{r.company ? ` (${r.company})` : ""} →{" "}
                  <Link href={`/directory/${r.slug}`}>{nameBySlug.get(r.slug) || r.slug}</Link>
                </span>
              </div>
              {r.title && <strong style={{ display: "block", marginTop: 6 }}>{r.title}</strong>}
              <p className="rev-body" style={{ margin: "6px 0" }}>{r.body}</p>
              <div className="adm-rev-actions">
                <form action="/api/admin/reviews" method="post">
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="action" value="publish" />
                  <button type="submit" className="btn btn--primary btn--sm">Publish</button>
                </form>
                <form action="/api/admin/reviews" method="post">
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="action" value="reject" />
                  <button type="submit" className="btn btn--ghost btn--sm">Reject</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Emailed vendors who visited */}
      <h2 className="form-section" style={{ marginTop: 40 }}>
        Visited from outreach <span className="opt">— {visited.filter((v) => nameBySlug.has(v.slug)).length}</span>
      </h2>
      {visited.filter((v) => nameBySlug.has(v.slug)).length === 0 ? (
        <p className="hint">No email click-throughs yet.</p>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Company</th><th>Visits</th><th>Last seen (UTC)</th></tr></thead>
            <tbody>
              {visited.filter((v) => nameBySlug.has(v.slug)).map((v) => (
                <tr key={v.slug}>
                  <td><Link href={`/directory/${v.slug}`}>{nameBySlug.get(v.slug)}</Link></td>
                  <td>{v.count}</td>
                  <td>{v.last ? v.last.replace("T", " ").slice(0, 16) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Clicked through from the badge email */}
      <h2 className="form-section" style={{ marginTop: 40 }}>
        Clicked from badge email <span className="opt">— {badgeVisited.filter((v) => nameBySlug.has(v.slug)).length}</span>
      </h2>
      {badgeVisited.filter((v) => nameBySlug.has(v.slug)).length === 0 ? (
        <p className="hint">No badge-email click-throughs yet.</p>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Company</th><th>Clicks</th><th>Last seen (UTC)</th></tr></thead>
            <tbody>
              {badgeVisited.filter((v) => nameBySlug.has(v.slug)).map((v) => (
                <tr key={v.slug}>
                  <td><Link href={`/directory/${v.slug}`}>{nameBySlug.get(v.slug)}</Link></td>
                  <td>{v.count}</td>
                  <td>{v.last ? v.last.replace("T", " ").slice(0, 16) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Badge actually embedded on an external site */}
      <h2 className="form-section" style={{ marginTop: 40 }}>
        Badge embedded on their site <span className="opt">— {badgeEmbeds.filter((v) => nameBySlug.has(v.slug)).length}</span>
      </h2>
      {badgeEmbeds.filter((v) => nameBySlug.has(v.slug)).length === 0 ? (
        <p className="hint">No external badge embeds detected yet.</p>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Company</th><th>Loads</th><th>On domain(s)</th><th>Last seen (UTC)</th></tr></thead>
            <tbody>
              {badgeEmbeds.filter((v) => nameBySlug.has(v.slug)).map((v) => (
                <tr key={v.slug}>
                  <td><Link href={`/directory/${v.slug}`}>{nameBySlug.get(v.slug)}</Link></td>
                  <td>{v.count}</td>
                  <td>{v.hosts.length ? v.hosts.join(", ") : "—"}</td>
                  <td>{v.last ? v.last.replace("T", " ").slice(0, 16) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Top listings */}
      <h2 className="form-section" style={{ marginTop: 40 }}>Top listings by views</h2>
      {activity.top.length === 0 ? (
        <p className="hint">No view data yet.</p>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>#</th><th>Company</th><th>Views</th><th>Website</th><th>Email</th></tr></thead>
            <tbody>
              {activity.top.map((t, i) => (
                <tr key={t.slug}>
                  <td>{i + 1}</td>
                  <td><Link href={`/directory/${t.slug}`}>{nameBySlug.get(t.slug) || t.slug}</Link></td>
                  <td>{t.view}</td><td>{t.website}</td><td>{t.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Deliverability: bounces + complaints (from Resend webhook) */}
      <h2 className="form-section" style={{ marginTop: 40 }}>
        Bounces <span className="opt">— {bounces.length}</span>
        {"  "}·  Spam complaints <span className="opt">— {complaints.length}</span>
      </h2>
      {bounces.length === 0 && complaints.length === 0 ? (
        <p className="hint">
          No bounces or complaints recorded. (Requires the Resend webhook — see setup.)
        </p>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Email</th><th>Type</th><th>Reason</th><th>When (UTC)</th></tr></thead>
            <tbody>
              {complaints.map((c) => (
                <tr key={`c-${c.email}`}>
                  <td>{c.email}</td><td><span className="adm-no">complaint</span></td><td>spam report</td><td>{fmt(c.at || "")}</td>
                </tr>
              ))}
              {bounces.map((b) => (
                <tr key={`b-${b.email}`}>
                  <td>{b.email}</td><td><span className="adm-no">bounce</span></td><td>{b.reason || "—"}</td><td>{fmt(b.at || "")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Unsubscribes */}
      <h2 className="form-section" style={{ marginTop: 40 }}>
        Unsubscribes <span className="opt">— {unsubs.length}</span>
      </h2>
      {unsubs.length === 0 ? (
        <p className="hint">No unsubscribes.</p>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Email</th><th>When (UTC)</th></tr></thead>
            <tbody>
              {unsubs.map((u) => (
                <tr key={u.email}>
                  <td>{u.email}</td>
                  <td>{u.at ? u.at.replace("T", " ").slice(0, 16) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
