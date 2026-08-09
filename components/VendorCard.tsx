import Link from "next/link";
import { Vendor } from "@/lib/types";
import { VendorLogo } from "./VendorLogo";

export function VendorCard({ vendor }: { vendor: Vendor }) {
  return (
    <Link href={`/directory/${vendor.slug}`} className={`vcard tier-${vendor.tier}`}>
      <div className="vcard-top">
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <VendorLogo name={vendor.name} website={vendor.website} logo={vendor.logo} size={40} />
          <div>
            <h3>{vendor.name}</h3>
            <div className="vsub">{vendor.subcategory}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {vendor.tier === "Featured" && (
            <span className="badge badge--featured">Featured</span>
          )}
          {vendor.tier === "Premium" && (
            <span className="badge badge--premium">Premium</span>
          )}
          {vendor.verified && (
            <span className="badge badge--verified">
              <span className="v" />
              Verified
            </span>
          )}
        </div>
      </div>

      <p>{vendor.description}</p>

      <div className="tag-row">
        {vendor.formats.map((f) => (
          <span key={f} className="tag">
            {f}
          </span>
        ))}
      </div>

      <div className="vcard-meta">
        <span>{vendor.location}</span>
        <span>· {vendor.coverage}</span>
      </div>
    </Link>
  );
}
