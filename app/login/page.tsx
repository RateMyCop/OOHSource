import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionEmail } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Owner sign in",
  robots: { index: false, follow: false },
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  if (getSessionEmail()) redirect("/dashboard");

  return (
    <section className="wrap page-head" style={{ paddingBottom: 100 }}>
      <div className="crumb">
        <a href="/">Home</a>
        <span>/</span>
        <span>Owner sign in</span>
      </div>
      <h1>Owner sign in.</h1>
      <p className="lede" style={{ marginBottom: 30 }}>
        Manage your listing and see how many buyers are viewing and contacting
        you. Sign-in is by secure email link — no password needed.
      </p>
      <LoginForm initialError={searchParams.error === "1"} />
      <p className="hint" style={{ marginTop: 24 }}>
        Haven&rsquo;t claimed your listing yet? Find your company in the{" "}
        <a href="/directory">directory</a> and click &ldquo;Claim this
        listing.&rdquo;
      </p>
    </section>
  );
}
