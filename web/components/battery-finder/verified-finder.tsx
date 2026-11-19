"use client";

import { useId, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bike, CarFront } from "lucide-react";
import { ChoiceSelect, SearchChoice } from "@/components/design/choice-field";
import { Notice } from "@/components/design/commerce-ui";
import type { CatalogVehicle } from "@/lib/catalog";
import { BATTERY_CATEGORIES, normalize, type BatteryCategory } from "@/lib/store-policy";

function options(values: string[]) {
  return [...new Map(values.map((value) => [normalize(value), value.trim()])).entries()]
    .sort(([, a], [, b]) => a.localeCompare(b)).map(([value, label]) => ({ value, label }));
}

export function VerifiedFinder({ vehicles, brands, initialType = "Car", manufacturer, initialVehicle, selectedBrand }: {
  vehicles: CatalogVehicle[]; brands: string[]; initialType?: BatteryCategory; manufacturer?: string;
  initialVehicle?: CatalogVehicle; selectedBrand?: string;
}) {
  const id = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [type, setType] = useState<BatteryCategory>(initialType);
  const [make, setMake] = useState(normalize(initialVehicle?.brand ?? manufacturer ?? ""));
  const [model, setModel] = useState(normalize(initialVehicle?.model ?? ""));
  const [vehicleId, setVehicleId] = useState(initialVehicle ? String(initialVehicle.id) : "");
  const rows = vehicles.filter((vehicle) => vehicle.type === type);
  const models = rows.filter((vehicle) => normalize(vehicle.brand) === make);
  const variants = models.filter((vehicle) => normalize(vehicle.model) === model);
  const selection = variants.find((variant) => String(variant.id) === vehicleId);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selection || pending) return;
    const brand = String(new FormData(event.currentTarget).get("brand") ?? "");
    const params = new URLSearchParams({ vehicle: String(selection.id) });
    if (brand) params.set("brand", brand);
    startTransition(() => router.push("/shop?" + params));
  }

  return <section className="finder panel" id="battery-finder" aria-labelledby={id}>
    <form className="finder-form" onSubmit={submit}>
      <div className="finder-top">
        <div><h2 id={id}>Find a battery for your vehicle</h2><p>Choose the exact model and variant to see verified matches.</p></div>
        {vehicles.length > 0 && !manufacturer && <fieldset className="vehicle-tabs">
          <legend className="sr-only">Vehicle type</legend>
          {BATTERY_CATEGORIES.map((category) => {
            const Icon = category === "Car" ? CarFront : Bike;
            return <label key={category}>
              <input type="radio" name="type" checked={type === category} onChange={() => {
                setType(category); setMake(""); setModel(""); setVehicleId("");
              }} /><Icon size={17} aria-hidden="true" />{category}
            </label>;
          })}
        </fieldset>}
      </div>
      {rows.length > 0 ? <>
        <div className="finder-fields">
          <SearchChoice key={type} label="Manufacturer" options={options(rows.map((row) => row.brand))} value={make}
            onChange={(value) => { setMake(value); setModel(""); setVehicleId(""); }} placeholder="Choose make" />
          <SearchChoice key={type + "/" + make} label="Model" options={options(models.map((row) => row.model))} value={model}
            onChange={(value) => { setModel(value); setVehicleId(""); }} disabled={!make} placeholder={make ? "Choose model" : "Pick a make"} />
          <ChoiceSelect label="Variant / fuel type" options={variants.map((row) => ({ value: String(row.id), label: row.variant || "Variant unspecified" }))}
            value={vehicleId || null} onChange={setVehicleId} disabled={!model} placeholder={model ? "Choose variant" : "Pick a model"} />
          <ChoiceSelect label="Battery brand" name="brand" options={[{ value: "", label: "Any brand" }, ...brands.map((brand) => ({ value: brand, label: brand }))]}
            defaultValue={brands.find((brand) => normalize(brand) === normalize(selectedBrand ?? "")) ?? ""} />
        </div>
        <div className="finder-bottom">
          <p className="finder-review" aria-live="polite">{selection ? [selection.brand, selection.model, selection.variant].filter(Boolean).join(" · ")
            : "Select a variant to check fitment."}</p>
          <button type="submit" className="shop-button primary" disabled={!selection || pending}>{pending ? "Checking fitment…" : "Find compatible batteries"}</button>
        </div>
      </> : <div className="finder-unavailable">
        <Notice>Vehicle options are currently unavailable for this selection. <Link className="text-link" href="/shop">Browse batteries</Link> or <Link className="text-link" href="/contact">get fitment help</Link>.</Notice>
      </div>}
    </form>
  </section>;
}
