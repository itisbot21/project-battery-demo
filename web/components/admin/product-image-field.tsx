"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Trash2 } from "lucide-react";
import { Notice } from "@/components/design/commerce-ui";
import { BatteryImage } from "@/components/products/battery-image";
import { validImageReference } from "@/lib/image-reference";

type Props = { initialUrls: string[]; uploadsEnabled: boolean; onUploadingChange?: (uploading: boolean) => void };

export function ProductImageField({ initialUrls, uploadsEnabled, onUploadingChange }: Props) {
  const [urls, setUrls] = useState(initialUrls);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  async function upload(file: File | undefined) {
    if (!file || uploading || !uploadsEnabled || urls.length >= 5) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 3_000_000) {
      setError("Choose a JPEG, PNG, or WebP photo smaller than 3 MB.");
      if (fileInput.current) fileInput.current.value = "";
      return;
    }

    setUploading(true);
    onUploadingChange?.(true);
    setError("");
    try {
      const data = new FormData();
      data.append("image", file);
      const response = await fetch("/api/admin/product-images", { method: "POST", body: data });
      const result: { url?: string; error?: string } = await response.json();
      if (!response.ok || !result.url) throw new Error(result.error || "Image upload failed.");
      const url = result.url;
      setUrls((current) => [...current, url]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Image upload failed.");
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function addReference() {
    const url = reference.trim();
    if (!validImageReference(url)) { setError("Use a secure HTTPS photo URL or a local /images/ reference."); return; }
    if (urls.includes(url)) { setError("This photo is already listed."); return; }
    setUrls((current) => [...current, url]);
    setReference("");
    setError("");
  }

  function move(index: number, change: number) {
    const destination = index + change;
    setUrls((current) => {
      if (destination < 0 || destination >= current.length) return current;
      const next = [...current];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
  }

  return <section className="panel operations-card admin-form-section">
    <h2>Product photos</h2>
    <p className="field-hint">Add up to five verified photos. The first appears in the catalog.</p>
    <input type="hidden" name="imageUrls" value={JSON.stringify(urls)} />
    {!!urls.length && <div className="admin-upload-grid">{urls.map((url, index) => <div key={url + index}>
      <BatteryImage src={url} alt={"Product photo " + (index + 1)} />
      <div className="admin-image-tools">
        <button className="icon-button" type="button" aria-label="Move photo earlier" disabled={index === 0 || uploading} onClick={() => move(index, -1)}><ArrowLeft size={16} aria-hidden="true" /></button>
        <button className="icon-button" type="button" aria-label="Move photo later" disabled={index === urls.length - 1 || uploading} onClick={() => move(index, 1)}><ArrowRight size={16} aria-hidden="true" /></button>
        <button className="icon-button" type="button" aria-label={"Remove photo " + (index + 1)} disabled={uploading}
          onClick={() => setUrls((current) => current.filter((_, i) => i !== index))}><Trash2 size={16} aria-hidden="true" /></button>
      </div>
    </div>)}</div>}
    {urls.length < 5 && <>
      {uploadsEnabled ? <label className="admin-upload-trigger">
        <ImagePlus size={19} aria-hidden="true" /><span>{uploading ? "Uploading…" : "Upload photo"}</span>
        <input ref={fileInput} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading}
          onChange={(event) => void upload(event.target.files?.[0])} />
      </label> : <p className="field-hint">Add photos by URL while uploads are unavailable.</p>}
      <div className="grid items-end gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <label className="form-field">Image URL
          <input className="store-input" value={reference} maxLength={700} inputMode="url" placeholder="https://…"
            onChange={(event) => setReference(event.target.value)} onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              if (reference.trim() && !uploading) addReference();
            }} />
        </label>
        <button type="button" className="shop-button" disabled={!reference.trim() || uploading} onClick={addReference}>Add URL</button>
      </div>
    </>}
    {error && <Notice tone="critical">{error}</Notice>}
    {uploading && <Notice>Saving the image. Wait for it to finish before saving this listing.</Notice>}
  </section>;
}
