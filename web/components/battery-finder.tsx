
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type VehicleType = "Car" | "Bike";

type VehicleSelection = {
  type: VehicleType;
  brand: string;
  model: string;
  variant: string;
};

type BatteryFinderProps = {
  onSearch: (vehicle: VehicleSelection) => void;
};

// Demo vehicle list - not verified compatibility data
const vehicles = [
  { type: "Car", brand: "Hyundai", model: "i20", variant: "Petrol" },
  { type: "Car", brand: "Hyundai", model: "i20", variant: "Diesel" },
  { type: "Car", brand: "Hyundai", model: "Creta", variant: "Petrol" },
  { type: "Car", brand: "Maruti Suzuki", model: "Swift", variant: "Petrol" },
  { type: "Car", brand: "Maruti Suzuki", model: "Baleno", variant: "Petrol" },
  { type: "Bike", brand: "Honda", model: "Activa", variant: "110" },
  { type: "Bike", brand: "Honda", model: "Activa", variant: "125" },
  { type: "Bike", brand: "Hero", model: "Splendor", variant: "Plus" },
] satisfies VehicleSelection[];

export default function BatteryFinder({
  onSearch,
}: BatteryFinderProps) {

  const [type, setType] = useState<VehicleType>("Car");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [variant, setVariant] = useState("");

  // Available manufacturers
  const brands = [
    ...new Set(
      vehicles
        .filter((vehicle) => vehicle.type === type)
        .map((vehicle) => vehicle.brand)
    ),
  ];

  // Available models
  const models = [
    ...new Set(
      vehicles
        .filter(
          (vehicle) =>
            vehicle.type === type &&
            vehicle.brand === brand
        )
        .map((vehicle) => vehicle.model)
    ),
  ];

  // Available variants
  const variants = [
    ...new Set(
      vehicles
        .filter(
          (vehicle) =>
            vehicle.type === type &&
            vehicle.brand === brand &&
            vehicle.model === model
        )
        .map((vehicle) => vehicle.variant)
    ),
  ];

  const selectClass =
    "w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 disabled:opacity-50";

  function handleSearch() {
    if (!brand || !model || !variant) return;

    onSearch({
      type,
      brand,
      model,
      variant,
    });
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">

      <div className="rounded-2xl border bg-white p-6 shadow-sm">

        <h2 className="text-2xl font-bold text-slate-900">
          Find Your Battery
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Select your vehicle to explore batteries.
        </p>

        {/* Vehicle Type */}
        <div className="mt-6 flex gap-3">

          {(["Car", "Bike"] as VehicleType[]).map((item) => (
            <Button
              key={item}
              variant={type === item ? "default" : "outline"}
              onClick={() => {
                setType(item);
                setBrand("");
                setModel("");
                setVariant("");
              }}
            >
              {item === "Car" ? "🚗 Car" : "🏍️ Bike"}
            </Button>
          ))}

        </div>

        {/* Vehicle Selection */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">

          {/* Manufacturer */}
          <div>
            <label
              htmlFor="vehicle-brand"
              className="mb-2 block text-sm font-medium text-slate-900"
            >
              Manufacturer
            </label>

            <select
              id="vehicle-brand"
              className={selectClass}
              value={brand}
              onChange={(event) => {
                setBrand(event.target.value);
                setModel("");
                setVariant("");
              }}
            >
              <option value="">Select manufacturer</option>

              {brands.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {/* Model */}
          <div>
            <label
              htmlFor="vehicle-model"
              className="mb-2 block text-sm font-medium text-slate-900"
            >
              Model
            </label>

            <select
              id="vehicle-model"
              className={selectClass}
              value={model}
              disabled={!brand}
              onChange={(event) => {
                setModel(event.target.value);
                setVariant("");
              }}
            >
              <option value="">Select model</option>

              {models.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {/* Variant */}
          <div>
            <label
              htmlFor="vehicle-variant"
              className="mb-2 block text-sm font-medium text-slate-900"
            >
              Variant
            </label>

            <select
              id="vehicle-variant"
              className={selectClass}
              value={variant}
              disabled={!model}
              onChange={(event) => {
                setVariant(event.target.value);
              }}
            >
              <option value="">Select variant</option>

              {variants.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Search Button */}
        <Button
          className="mt-6 w-full md:w-auto"
          disabled={!brand || !model || !variant}
          onClick={handleSearch}
        >
          Search Batteries →
        </Button>

        <p className="mt-4 text-xs text-slate-500">
          Demo vehicle data. Exact battery compatibility
          will be verified when we build our product database.
        </p>

      </div>

    </section>
  );
}