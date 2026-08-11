"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";

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

const MAX_IMAGES = 12;

export function ListingEditor(p: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [hero, setHero] = useState(p.heroImage);
  const [images, setImages] = useState<string[]>(p.gallery);
  const [uploadMsg, setUploadMsg] = useState("");
  const [busyHero, setBusyHero] = useState(false);
  const [busyGallery, setBusyGallery] = useState(false);
  const [overZone, setOverZone] = useState<"hero" | "gallery" | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [urlAdd, setUrlAdd] = useState("");

  const formRef = useRef<HTMLFormElement>(null);
  const heroInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);

  async function uploadOne(file: File): Promise<string> {
    const res = await upload(`${p.slug}/${file.name}`, file, {
      access: "public",
      handleUploadUrl: "/api/owner/upload",
      clientPayload: JSON.stringify({ slug: p.slug }),
    });
    return res.url;
  }

  async function addGalleryFiles(files: File[]) {
    const imgs = files.filter((f) => f.type.startsWith("image/"));
    if (!imgs.length) return;
    setUploadMsg("");
    setBusyGallery(true);
    try {
      for (const file of imgs) {
        if (images.length >= MAX_IMAGES) break;
        const url = await uploadOne(file);
        setImages((prev) => (prev.length >= MAX_IMAGES ? prev : [...prev, url]));
      }
    } catch (e) {
      setUploadMsg(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusyGallery(false);
    }
  }

  async function setHeroFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setUploadMsg("");
    setBusyHero(true);
    try {
      setHero(await uploadOne(file));
    } catch (e) {
      setUploadMsg(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusyHero(false);
    }
  }

  function removeImage(i: number) {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
  }

  function reorder(from: number, to: number) {
    if (from === to) return;
    setImages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function addByUrl() {
    const u = urlAdd.trim();
    if (!/^https?:\/\//i.test(u)) return;
    setImages((prev) => (prev.length >= MAX_IMAGES ? prev : [...prev, u]));
    setUrlAdd("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      slug: p.slug,
      website: fd.get("website"),
      phone: fd.get("phone"),
      address: fd.get("address"),
      description: fd.get("description"),
      heroImage: hero,
      gallery: images.join("\n"),
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
    <form ref={formRef} onSubmit={handleSubmit} className="form-wrap">
      {status === "saved" && (
        <div className="form-ok show" role="status">
          ✓ Saved. Your public listing updates within about a minute.
        </div>
      )}

      <h2 className="form-section">Contact & links</h2>

      <div className="field">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="url" defaultValue={p.website} placeholder="https://" disabled={saving} />
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
        <textarea id="description" name="description" rows={8} defaultValue={p.description} disabled={saving} />
        <span className="hint">What you do, who you serve, and where.</span>
      </div>

      <h2 className="form-section">Header image</h2>
      <div className="field">
        <input
          ref={heroInput}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setHeroFile(f);
            e.target.value = "";
          }}
        />
        {hero ? (
          <div className="edit-hero-preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={hero} alt="Header preview" onError={(e) => (e.currentTarget.style.opacity = "0.3")} />
            <button type="button" className="img-remove" onClick={() => setHero("")} aria-label="Remove header image">
              ×
            </button>
          </div>
        ) : (
          <div
            className={`dropzone${overZone === "hero" ? " dropzone--over" : ""}`}
            onClick={() => heroInput.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setOverZone("hero");
            }}
            onDragLeave={() => setOverZone(null)}
            onDrop={(e) => {
              e.preventDefault();
              setOverZone(null);
              const f = e.dataTransfer.files?.[0];
              if (f) setHeroFile(f);
            }}
          >
            {busyHero ? "Uploading…" : "Drag an image here, or click to upload a header banner"}
          </div>
        )}
        <span className="hint">
          JPG, PNG, WebP, GIF or AVIF · up to 8&nbsp;MB · looks best wide and
          landscape (around 1600×700px).
        </span>
      </div>

      <h2 className="form-section">
        Portfolio photos <span className="opt">— {images.length}/{MAX_IMAGES}</span>
      </h2>
      <span className="hint" style={{ display: "block", marginBottom: 12 }}>
        Up to {MAX_IMAGES} images · JPG, PNG, WebP, GIF or AVIF · 8&nbsp;MB each ·
        ~1200px wide works well. Drag thumbnails to reorder; the first is shown
        first.
      </span>

      <input
        ref={galleryInput}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          addGalleryFiles(Array.from(e.target.files || []));
          e.target.value = "";
        }}
      />

      {images.length > 0 && (
        <div className="thumb-grid">
          {images.map((u, i) => (
            <div
              key={`${u}-${i}`}
              className={`thumb${dragIdx === i ? " thumb--drag" : ""}`}
              draggable
              onDragStart={() => setDragIdx(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIdx !== null) reorder(dragIdx, i);
                setDragIdx(null);
              }}
              onDragEnd={() => setDragIdx(null)}
              title="Drag to reorder"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt={`Portfolio ${i + 1}`} onError={(e) => (e.currentTarget.style.opacity = "0.3")} />
              <button type="button" className="thumb-del" onClick={() => removeImage(i)} aria-label="Remove image">
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length < MAX_IMAGES && (
        <div
          className={`dropzone${overZone === "gallery" ? " dropzone--over" : ""}`}
          onClick={() => galleryInput.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setOverZone("gallery");
          }}
          onDragLeave={() => setOverZone(null)}
          onDrop={(e) => {
            e.preventDefault();
            setOverZone(null);
            addGalleryFiles(Array.from(e.dataTransfer.files || []));
          }}
        >
          {busyGallery ? "Uploading…" : "Drag images here, or click to upload photos"}
        </div>
      )}

      <div className="url-add">
        <input
          type="url"
          value={urlAdd}
          onChange={(e) => setUrlAdd(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addByUrl();
            }
          }}
          placeholder="…or paste an image URL"
          disabled={saving || images.length >= MAX_IMAGES}
        />
        <button type="button" className="btn btn--ghost btn--sm" onClick={addByUrl} disabled={images.length >= MAX_IMAGES}>
          Add
        </button>
      </div>
      {uploadMsg && (
        <div className="feature-err" role="alert" style={{ textAlign: "left", marginTop: 8 }}>
          {uploadMsg}
        </div>
      )}

      {status === "error" && (
        <div className="report-error" role="alert" style={{ margin: "18px 0" }}>
          {errorMsg}
        </div>
      )}

      <button className="btn btn--primary" type="submit" disabled={saving} style={{ marginTop: 26 }}>
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
