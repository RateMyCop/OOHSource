import type { Metadata } from "next";
import Link from "next/link";
import { findRecordIdByToken } from "@/lib/airtable";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Confirm your listing",
  robots: { index: false, follow: false },
};

// Two-step confirmation. The emailed link opens this page (GET) which only
// *reads* to check the token is still valid — no mutation — so link scanners
// can't confirm on the user's behalf. The actual confirm happens when the human
// clicks the button, which POSTs to /api/verify. After that we land back here
// with ?state=ok|error and show the result.
export default async function VerifyPage({
  searchParams,
}: {
  searchParams: { token?: string; type?: string; state?: string };
}) {
  const token = typeof searchParams.token === "string" ? searchParams.token : "";
  const isClaim = searchParams.type === "claim";
  const stateParam = searchParams.state;

  let mode: "confirm" | "ok" | "error" | "invalid" = "invalid";
  if (stateParam === "ok") mode = "ok";
  else if (stateParam === "error") mode = "error";
  else if (token) {
    try {
      const id = await findRecordIdByToken(token, isClaim ? "Claims" : undefined);
      mode = id ? "confirm" : "invalid";
    } catch {
      mode = "error";
    }
  }

  if (mode === "confirm") {
    return (
      <section className="wrap page-head" style={{ paddingBottom: 100 }}>
        <span className="eyebrow">
          <span className="label label--accent">One more step</span>
        </span>
        <h1>{isClaim ? "Confirm your claim." : "Confirm your listing."}</h1>
        <p className="lede" style={{ marginBottom: 26 }}>
          {isClaim
            ? "Click below to confirm your claim and send it for review."
            : "Click below to confirm your email and send your listing for review."}
        </p>
        <form action="/api/verify" method="post">
          <input type="hidden" name="token" value={token} />
          {isClaim && <input type="hidden" name="type" value="claim" />}
          <button className="btn btn--primary" type="submit">
            {isClaim ? "Confirm your claim →" : "Confirm your listing →"}
          </button>
        </form>
      </section>
    );
  }

  const content = {
    ok: isClaim
      ? {
          label: "Claim confirmed",
          heading: "Claim confirmed.",
          body: "Thanks — we've received your claim. If your email matches the company domain you can sign in now; otherwise we'll review and approve it shortly.",
        }
      : {
          label: "Confirmed",
          heading: "Email confirmed.",
          body: "Your listing is now in our review queue — we'll verify the details and publish it shortly. Thanks for adding to the directory.",
        },
    invalid: {
      label: "Link expired",
      heading: "This link is invalid or already used.",
      body: "Confirmation links work once. If your listing is already confirmed, you're all set. Otherwise, submit it again and we'll send a fresh link.",
    },
    error: {
      label: "Something went wrong",
      heading: "We couldn't confirm your listing.",
      body: "Please try the link again in a minute. If it keeps failing, submit your listing again for a fresh confirmation link.",
    },
  }[mode];

  return (
    <section className="wrap page-head" style={{ paddingBottom: 100 }}>
      <span className="eyebrow">
        <span className="label label--accent">{content.label}</span>
      </span>
      <h1>{content.heading}</h1>
      <p className="lede" style={{ marginBottom: 26 }}>
        {content.body}
      </p>
      <div className="hero-cta">
        {mode === "ok" && isClaim ? (
          <Link className="btn btn--primary" href="/login">
            Sign in to your dashboard
          </Link>
        ) : (
          <Link className="btn btn--primary" href="/directory">
            Browse the directory
          </Link>
        )}
        {mode !== "ok" && (
          <Link className="btn btn--ghost" href="/list-your-company">
            Submit a listing
          </Link>
        )}
      </div>
    </section>
  );
}
