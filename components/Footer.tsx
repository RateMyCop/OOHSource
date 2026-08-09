import Link from "next/link";
import { LISTS } from "@/lib/lists";

export function Footer() {
  return (
    <footer className="site">
      <div className="wrap">
        <div className="foot">
          <div>
            <Link className="brand" href="/">
              <span className="mark" aria-hidden="true" />
              <span className="ooh">OOH</span>
              <span className="src">source</span>
            </Link>
            <p className="foot-tag">
              The neutral, vetted directory of the world&rsquo;s out-of-home
              advertising industry.
            </p>
          </div>
          <div className="foot-links">
            <div className="foot-col">
              <span className="h">Directory</span>
              <Link href="/directory">Browse all</Link>
              <Link href="/agencies">Agencies</Link>
              <Link href="/vendors">Vendors</Link>
            </div>
            <div className="foot-col">
              <span className="h">Get listed</span>
              <Link href="/list-your-company">Add a company</Link>
              <Link href="/list-your-company">Claim a listing</Link>
              <Link href="/pricing">Featured placement</Link>
            </div>
            <div className="foot-col">
              <span className="h">Rankings</span>
              <Link href="/best">Best of OOH</Link>
              {LISTS.slice(0, 3).map((l) => (
                <Link key={l.slug} href={`/best/${l.slug}`}>
                  {l.title.replace(/^Top 10 /, "")}
                </Link>
              ))}
            </div>
            <div className="foot-col">
              <span className="h">Company</span>
              <Link href="/pricing">Pricing</Link>
              <Link href="/directory">Browse directory</Link>
              <Link href="/list-your-company">List your company</Link>
            </div>
          </div>
        </div>
        <div className="foot-base">
          <span>&copy; 2026 OOHsource &middot; oohsource.com</span>
          <span>Worldwide &middot; Out-of-home advertising</span>
        </div>
      </div>
    </footer>
  );
}
