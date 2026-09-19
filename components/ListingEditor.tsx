"use client";

import { useEffect, useRef, useState } from "react";

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
const MAX_DIM = 1600; // cap the longest edge
const QUALITY = 0.82;

function toBlobAsync(canvas: HTMLCanvasElement, type: string, q: number): Promise<Blob | null> {
  return new Promise((res) => canvas.toBlob((b) => res(b), type, q));
}

// Downscale/compress an image in the browser before upload: cap the longest
// edge at ~1600px and re-encode as WebP (falling back to JPEG). Keeps GIFs
// untouched (to preserve animation) and returns the original if shrinking
// wouldn't help.
async function shrinkImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const { width, height } = bitmap;
    const scale = Math.min(1, MAX_DIM / Math.max(width, height));
    if (scale === 1 && file.size <= 1_000_000) {
      bitmap.close?.();
      return file;
    }
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close?.();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    let type = "image/webp";
    let blob = await toBlobAsync(canvas, type, QUALITY);
    if (!blob) {
      type = "image/jpeg";
      blob = await toBlobAsync(canvas, type, QUALITY);
    }
    if (!blob || blob.size >= file.size) return file;
    const base = (file.name || "image").replace(/\.[^.]+$/, "");
    const ext = type === "image/webp" ? "webp" : "jpg";
    return new File([blob], `${base}.${ext}`, { type });
  } catch {
    return file;
  }
}

export function ListingEditor(p: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [hero, setHero] = useState(p.heroImage);
  const [heroPreview, setHeroPreview] = useState(""); // instant local preview while uploading
  const [images, setImages] = useState<string[]>(p.gallery);
  const [pending, setPending] = useState<{ id: string; url: string }[]>([]); // optimistic gallery previews
  const [uploadMsg, setUploadMsg] = useState("");
  const [busyHero, setBusyHero] = useState(false);
  const [overZone, setOverZone] = useState<"hero" | "gallery" | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [urlAdd, setUrlAdd] = useState("");

  const [aiBusy, setAiBusy] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[] | null>(null);
  const [aiDesc, setAiDesc] = useState("");
  const [aiErr, setAiErr] = useState("");

  const formRef = useRef<HTMLFormElement>(null);
  const heroInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  // Auto-save plumbing. `latest` gives the debounced saver a live snapshot of
  // the image state (which lives in React state, not the form).
  const latest = useRef({ hero: p.heroImage, images: p.gallery });
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    latest.current = { hero, images };
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    scheduleSave(); // header/photos changed — persist automatically
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hero, images]);

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  async function optimize() {
    setAiBusy(true);
    setAiErr("");
    setAiSuggestions(null);
    setAiDesc("");
    try {
      const res = await fetch("/api/owner/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: p.slug, description: descRef.current?.value || "" }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.ok) throw new Error(d.error || "Couldn't analyze your listing.");
      setAiSuggestions(d.suggestions || []);
      setAiDesc(d.description || "");
    } catch (e) {
      setAiErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setAiBusy(false);
    }
  }

  function applyAiDesc() {
    if (descRef.current && aiDesc) descRef.current.value = aiDesc;
    setAiDesc("");
    setAiSuggestions(null);
    scheduleSave(); // programmatic change — no blur fires, so save explicitly
  }

  async function uploadOne(file: File): Promise<string> {
    const shrunk = await shrinkImage(file);
    const fd = new FormData();
    fd.append("file", shrunk, shrunk.name);
    fd.append("slug", p.slug);
    const res = await fetch("/api/owner/upload", { method: "POST", body: fd });
    const d = await res.json().catch(() => ({}));
    if (!res.ok || !d.url) throw new Error(d.error || "Upload failed.");
    return d.url as string;
  }

  async function addGalleryFiles(files: File[]) {
    const imgs = files.filter((f) => f.type.startsWith("image/"));
    if (!imgs.length) return;
    setUploadMsg("");
    // Only take what fits, then show every thumbnail immediately and upload them
    // all in parallel — no more one-at-a-time "Uploading…".
    const slots = MAX_IMAGES - images.length - pending.length;
    const batch = imgs.slice(0, Math.max(0, slots)).map((file) => ({
      file,
      id: Math.random().toString(36).slice(2),
      url: URL.createObjectURL(file),
    }));
    if (!batch.length) return;
    setPending((prev) => [...prev, ...batch.map(({ id, url }) => ({ id, url }))]);

    await Promise.all(
      batch.map(async ({ file, id, url }) => {
        try {
          const uploaded = await uploadOne(file);
          setImages((prev) => (prev.length >= MAX_IMAGES ? prev : [...prev, uploaded]));
        } catch (e) {
          setUploadMsg(e instanceof Error ? e.message : "Upload failed.");
        } finally {
          setPending((prev) => prev.filter((x) => x.id !== id));
          URL.revokeObjectURL(url);
        }
      })
    );
  }

  async function setHeroFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setUploadMsg("");
    const url = URL.createObjectURL(file);
    setHeroPreview(url); // show it instantly
    setBusyHero(true);
    try {
      setHero(await uploadOne(file));
    } catch (e) {
      setUploadMsg(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusyHero(false);
      setHeroPreview("");
      URL.revokeObjectURL(url);
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

  // Debounced auto-save: edits just stick, no Save button.
  function scheduleSave() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(saveNow, 700);
  }

  async function saveNow() {
    const f = formRef.current;
    if (!f) return;
    const fd = new FormData(f);
    const payload = {
      slug: p.slug,
      website: fd.get("website"),
      phone: fd.get("phone"),
      address: fd.get("address"),
      description: fd.get("description"),
      heroImage: latest.current.hero,
      gallery: latest.current.images.join("\n"),
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
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  return (
    <form ref={formRef} onSubmit={(e) => e.preventDefault()} className="form-wrap">
      <div className="autosave" role="status" aria-live="polite" data-state={status}>
        {status === "saving" && "Saving…"}
        {status === "saved" && "✓ All changes saved — your public listing updates within a few minutes."}
        {status === "error" && `⚠ ${errorMsg || "Couldn't save — we’ll retry on your next edit."}`}
        {status === "idle" && "Changes save automatically as you edit."}
      </div>

      <h2 className="form-section">Contact & links</h2>

      <div className="field">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="url" defaultValue={p.website} placeholder="https://" onBlur={scheduleSave} />
      </div>
      <div className="field">
        <label htmlFor="phone">Phone</label>
        <input id="phone" name="phone" type="tel" defaultValue={p.phone} onBlur={scheduleSave} />
      </div>
      <div className="field">
        <label htmlFor="address">Address</label>
        <input id="address" name="address" type="text" defaultValue={p.address} onBlur={scheduleSave} />
      </div>

      <h2 className="form-section">About</h2>
      <div className="field">
        <div className="opt-row">
          <label htmlFor="description">Description</label>
          <button type="button" className="opt-btn" onClick={optimize} disabled={aiBusy}>
            {aiBusy ? "Analyzing…" : "✦ Improve with AI"}
          </button>
        </div>
        <textarea id="description" name="description" rows={8} defaultValue={p.description} onBlur={scheduleSave} ref={descRef} />
        <span className="hint">What you do, who you serve, and where.</span>

        {aiErr && <p className="opt-err">{aiErr}</p>}

        {aiSuggestions && (
          <div className="opt-panel">
            {aiSuggestions.length > 0 && (
              <>
                <span className="opt-h">Suggestions</span>
                <ul className="opt-list">
                  {aiSuggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </>
            )}
            {aiDesc && (
              <>
                <span className="opt-h">Suggested description</span>
                <div className="opt-preview">{aiDesc}</div>
                <div className="opt-actions">
                  <button type="button" className="opt-use" onClick={applyAiDesc}>
                    Use this description
                  </button>
                  <button type="button" className="opt-dismiss" onClick={() => { setAiDesc(""); setAiSuggestions(null); }}>
                    Dismiss
                  </button>
                </div>
                <span className="hint">Review it — applying it saves automatically.</span>
              </>
            )}
          </div>
        )}
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
        {hero || heroPreview ? (
          <div className={`edit-hero-preview${heroPreview && !hero ? " is-uploading" : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={hero || heroPreview} alt="Header preview" onError={(e) => (e.currentTarget.style.opacity = "0.3")} />
            {heroPreview && !hero && <span className="img-uploading">Uploading…</span>}
            {hero && (
              <button type="button" className="img-remove" onClick={() => setHero("")} aria-label="Remove header image">
                ×
              </button>
            )}
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

      {(images.length > 0 || pending.length > 0) && (
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
          {pending.map((p2) => (
            <div key={p2.id} className="thumb thumb--uploading" title="Uploading…">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p2.url} alt="Uploading" />
              <span className="img-uploading">Uploading…</span>
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
          {pending.length > 0
            ? `Uploading ${pending.length} photo${pending.length > 1 ? "s" : ""}…`
            : "Drag images here, or click to upload photos"}
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
          disabled={images.length >= MAX_IMAGES}
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

    </form>
  );
}
