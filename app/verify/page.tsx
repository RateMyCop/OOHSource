import type { Metadata } from "next";
import Link from "next/link";
import { findRecordIdByToken, updateAirtableRecord } from "@/lib/airtable";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Confirm your listing",
  robots: { index: false, follow: false },
};

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = typeof searchParams.token === "string" ? searchParams.token : "";
  let state: "ok" | "invalid" | "error" = "invalid";

  if (token) {
    try {
      const id = await findRecordIdByToken(token);
      if (id) {
        await updateAirtableRecord(id, {
          Status: "Pending Review",
          "Verify Token": "",
        });
        state = "ok";
      } else {
        state = "invalid";
      }
    } catch (e) {
      console.error("[oohsource] verify failed:", e);
      state = "error";
    }
  }

  const content = {
    ok: {
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
  }[state];

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
        <Link className="btn btn--primary" href="/directory">
          Browse the directory
        </Link>
        {state !== "ok" && (
          <Link className="btn btn--ghost" href="/list-your-company">
            Submit a listing
          </Link>
        )}
      </div>
    </section>
  );
}
