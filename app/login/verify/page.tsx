import type { Metadata } from "next";
import { readToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Confirm sign in",
  robots: { index: false, follow: false },
};

// Magic-link landing page. Rendering this (a GET) has NO side effect, so email
// security scanners that pre-fetch links can't consume the token. The token is
// only spent when the human clicks the button, which POSTs to the callback.
export default function LoginVerifyPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = typeof searchParams.token === "string" ? searchParams.token : "";
  const payload = readToken(token);
  const valid = payload && payload.t === "login";

  return (
    <section className="wrap page-head" style={{ paddingBottom: 100 }}>
      {valid ? (
        <>
          <span className="eyebrow">
            <span className="label label--accent">Almost there</span>
          </span>
          <h1>Confirm sign in.</h1>
          <p className="lede" style={{ marginBottom: 26 }}>
            You&rsquo;re signing in as <strong>{payload!.e}</strong>.
          </p>
          <form action="/api/auth/callback" method="post">
            <input type="hidden" name="token" value={token} />
            <button className="btn btn--primary" type="submit">
              Sign in to your dashboard &rarr;
            </button>
          </form>
        </>
      ) : (
        <>
          <span className="eyebrow">
            <span className="label label--accent">Link expired</span>
          </span>
          <h1>This sign-in link is invalid or expired.</h1>
          <p className="lede" style={{ marginBottom: 26 }}>
            Sign-in links work once and expire after 20 minutes. Request a fresh
            one and try again.
          </p>
          <a className="btn btn--primary" href="/login">
            Back to sign in
          </a>
        </>
      )}
    </section>
  );
}
