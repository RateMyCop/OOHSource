"use client";

import { useState } from "react";

type Props = {
  slug: string;
  website: string;
  phone: string;
  address: string;
  description: string;
  heroImage: string;
  gallery: string[];
};

type Status = "idle" | "saving" | "saved" | "error";

export function ListingEditor(p: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [hero, setHero] = useState(p.heroImage);
  const [gallery, setGallery] = useState(p.gallery.join("\n"));

  const galleryUrls = gallery
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter((u) => /^https?:\/\//i.test(u))
    .slice(0, 12);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      slug: p.slug,
      website: fd.get("website"),
      phone: fd.get("phone"),
      address: fd.get("address"),
      description: fd.get("description"),
      heroImage: fd.get("heroImage"),
      gallery: fd.get("gallery"),
    };
    setStatus("saving");
    setErrorMsg("");
    try {
      const res = await fetch("/api/owner/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Couldn't save your changes.");
      }
      setStatus("saved");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  const saving = status === "saving";

  return (
    <form onSubmit={handleSubmit} className="form-wrap">
      {status === "saved" && (
        <div className="form-ok show" role="status">
          ✓ Saved. Your public listing updates within about a minute.
        </div>
      )}

      <h2 className="form-section">Contact & links</h2>

      <div className="field">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="url"
          defaultValue={p.website}
          placeholder="https://"
          disabled={saving}
        />
      </div>

      <div className="field">
        <label htmlFor="phone">Phone</label>
        <input id="phone" name="phone" type="tel" defaultValue={p.phone} disabled={saving} />
      </div>

      <div className="field">
        <label htmlFor="address">Address</label>
        <input id="address" name="address" type="text" defaultValue={p.address} disabled={saving} />
      </div>

      <h2 className="form-section">About</h2>

      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          rows={8}
          defaultValue={p.description}
          disabled={saving}
        />
        <span className="hint">What you do, who you serve, and where.</span>
      </div>

      <h2 className="form-section">Images</h2>

      <div className="field">
        <label htmlFor="heroImage">Header image URL</label>
        <input
          id="heroImage"
          name="heroImage"
          type="url"
          value={hero}
          onChange={(e) => setHero(e.target.value)}
          placeholder="https://…/your-banner.jpg"
          disabled={saving}
        />
        <span className="hint">
          The wide banner at the top of your listing. Leave blank to remove it.
        </span>
        {/^https?:\/\//i.test(hero) && (
          <div className="edit-hero-preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={hero} alt="Header preview" onError={(e) => (e.currentTarget.style.display = "none")} />
          </div>
        )}
      </div>

      <div className="field">
        <label htmlFor="gallery">Portfolio images</label>
        <textarea
          id="gallery"
          name="gallery"
          rows={4}
          value={gallery}
          onChange={(e) => setGallery(e.target.value)}
          placeholder="One image URL per line — photos of your billboards, installs, screens, or work."
          disabled={saving}
        />
        <span className="hint">One image URL per line, up to 12.</span>
        {galleryUrls.length > 0 && (
          <div className="edit-gallery-preview">
            {galleryUrls.map((u, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={u} alt={`Portfolio ${i + 1}`} onError={(e) => (e.currentTarget.style.display = "none")} />
            ))}
          </div>
        )}
      </div>

      {status === "error" && (
        <div className="report-error" role="alert" style={{ marginBottom: 16 }}>
          {errorMsg}
        </div>
      )}

      <button className="btn btn--primary" type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
