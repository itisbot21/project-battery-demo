"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useState } from "react";
import { ChoiceSelect } from "@/components/design/choice-field";
import { Notice } from "@/components/design/commerce-ui";
import { SubmitButton } from "@/components/design/submit-button";
import { ProductImageField } from "./product-image-field";

export type VehicleOption = { id: number; type: string; brand: string; model: string; variant: string };

export type ProductEditable = {
  id: number; slug: string; brand: string; model: string; category: string; stock: number; active: boolean;
  capacityAh: number | null; warrantyMonths: number | null; warrantyFreeMonths: number | null; warrantyProRataMonths: number | null;
  description: string | null; imageUrls: string[]; features: string[]; specifications: Record<string, string>;
  seoTitle: string | null; seoDescription: string | null; mrpPaise: number; withoutExchangePaise: number; withExchangePaise: number;
};

type Props = {
  action: (formData: FormData) => Promise<void>; product?: ProductEditable; vehicles: VehicleOption[];
  selectedVehicleIds?: number[]; uploadsEnabled?: boolean;
};

const categoryOptions = [{ value: "Car", label: "Car battery" }, { value: "Bike", label: "Bike battery" }];

function currency(paise?: number) {
  return paise === undefined ? "" : (paise / 100).toFixed(2);
}

export function ProductForm({ action, product, vehicles, selectedVehicleIds = [], uploadsEnabled = false }: Props) {
  const [category, setCategory] = useState(product?.category || "Car");
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState(() => new Set(selectedVehicleIds));
  const [uploading, setUploading] = useState(false);

  const options = product && !categoryOptions.some((value) => value.value === product.category)
    ? [...categoryOptions, { value: product.category, label: product.category + " (legacy product)" }] : categoryOptions;
  const relevant = vehicles.filter((vehicle) => vehicle.type === category);
  const selections = relevant.filter((vehicle) => selected.has(vehicle.id));
  const query = filter.trim().toLowerCase();
  const results = relevant.filter((vehicle) => [vehicle.brand, vehicle.model, vehicle.variant].join(" ").toLowerCase().includes(query));

  function selectVehicle(vehicleId: number, checked: boolean) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (checked) next.add(vehicleId);
      else next.delete(vehicleId);
      return next;
    });
  }

  return <form action={action} className="admin-editor">
    <section className="panel operations-card admin-form-section">
      <h2>Battery information</h2>
      <div className="admin-field-grid">
        <label className="form-field">Brand<input className="store-input" name="brand" required minLength={2} maxLength={80} defaultValue={product?.brand} /></label>
        <label className="form-field">Model<input className="store-input" name="model" required minLength={2} maxLength={120} defaultValue={product?.model} /></label>
        <ChoiceSelect label="Category" name="category" value={category} options={options} onChange={setCategory} required />
        <label className="form-field">Stock quantity<input className="store-input" name="stock" type="number" min={0} max={1_000_000} step={1} required defaultValue={product?.stock ?? 0} /></label>
        <label className="form-field">Capacity (Ah)<input className="store-input" name="capacity" type="number" min={1} step={1} defaultValue={product?.capacityAh ?? ""} /></label>
        <label className="form-field">Total warranty (months)<input className="store-input" name="warranty" type="number" min={1} step={1} defaultValue={product?.warrantyMonths ?? ""} /></label>
        <label className="form-field">Free replacement (months)<input className="store-input" name="warrantyFree" type="number" min={1} step={1} defaultValue={product?.warrantyFreeMonths ?? ""} /></label>
        <label className="form-field">Pro-rata warranty (months)<input className="store-input" name="warrantyProRata" type="number" min={1} step={1} defaultValue={product?.warrantyProRataMonths ?? ""} /></label>
        <p className="field-hint full-field">The combined free and pro-rata periods must fit within the total warranty.</p>
      </div>
    </section>
    <section className="panel operations-card admin-form-section">
      <h2>GST-inclusive pricing</h2>
      <div className="admin-field-grid admin-price-grid">
        <label className="form-field">MRP (₹)<input className="store-input" name="mrp" required type="number" min=".01" step=".01" defaultValue={currency(product?.mrpPaise)} /></label>
        <label className="form-field">Without exchange (₹)<input className="store-input" name="withoutExchange" required type="number" min=".01" step=".01" defaultValue={currency(product?.withoutExchangePaise)} /></label>
        <label className="form-field">With exchange (₹)<input className="store-input" name="withExchange" required type="number" min=".01" step=".01" defaultValue={currency(product?.withExchangePaise)} /></label>
      </div>
      <p className="field-hint">Staff verify an old battery at delivery. If it is declined, the without-exchange price applies.</p>
    </section>
    <ProductImageField initialUrls={product?.imageUrls ?? []} uploadsEnabled={uploadsEnabled} onUploadingChange={setUploading} />
    <section className="panel operations-card admin-form-section">
      <h2>Product details</h2>
      <label className="form-field">Description<textarea className="store-input" name="description" rows={4} maxLength={6000} defaultValue={product?.description ?? ""} /></label>
      <div className="admin-field-grid">
        <label className="form-field">Key features <span className="field-hint">One per line. Up to 15 features.</span>
          <textarea className="store-input" name="features" rows={4} defaultValue={(product?.features ?? []).join("\n")} />
        </label>
        <label className="form-field">Technical specifications <span className="field-hint">One field and value per line, e.g. Voltage: 12V.</span>
          <textarea className="store-input" name="specifications" rows={4}
            defaultValue={Object.entries(product?.specifications ?? {}).map(([key, value]) => key + ": " + value).join("\n")} />
        </label>
      </div>
    </section>
    <section className="panel operations-card admin-form-section">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2>Verified vehicle fitment</h2><Link href="/admin/vehicles" className="text-link">Manage vehicles</Link>
      </div>
      {category === "Car" || category === "Bike" ? <>
        <label className="form-field">Search verified vehicles<span className="search-field"><Search size={17} aria-hidden="true" />
          <input className="store-input" type="search" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Manufacturer, model or variant" />
        </span></label>
        <p className="field-hint" role="status">{selections.length} selected. Assign only vehicles that fit this battery.</p>
        {selections.map((vehicle) => <input key={vehicle.id} type="hidden" name="vehicleIds" value={vehicle.id} />)}
        {results.length ? <div className="admin-verification-list">
          {results.map((vehicle) => <label key={vehicle.id}><input className="checkmark" type="checkbox" checked={selected.has(vehicle.id)}
            onChange={(event) => selectVehicle(vehicle.id, event.target.checked)} />{vehicle.brand} · {vehicle.model} · {vehicle.variant}</label>)}
        </div> : <Notice>No matching vehicles.</Notice>}
      </> : <Notice>This legacy battery category is excluded from vehicle fitment.</Notice>}
    </section>
    <section className="panel operations-card admin-form-section">
      <h2>Listing and search visibility</h2>
      <label className="form-field">SEO title<input className="store-input" name="seoTitle" maxLength={70} defaultValue={product?.seoTitle ?? ""} /></label>
      <label className="form-field">SEO description<textarea className="store-input" name="seoDescription" rows={2} maxLength={160} defaultValue={product?.seoDescription ?? ""} /></label>
      <label className="switch-option field-label"><input className="switch-control" type="checkbox" name="active" defaultChecked={product?.active ?? true} /> Active listing</label>
    </section>
    <div className="justify-self-start"><SubmitButton primary disabled={uploading}>{product ? "Save changes" : "Add battery"}</SubmitButton></div>
  </form>;
}
