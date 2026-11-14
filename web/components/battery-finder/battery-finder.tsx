"use client";

import { useMemo, useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { SelectField } from "./finder-select";
import { VehicleSelector, type VehicleType } from "./vehicle-selector";

export type FinderSelection = {
  type: "Car" | "Bike";
  brand: string;
  model: string;
  variant: string;
  batteryBrand: string;
};

type Props = {
  onSearch: (selection: FinderSelection) => void;
  availableBrands?: string[];
};

const demoVehicles = [
  { type: "Car", brand: "Hyundai", model: "i20", variant: "Petrol" },
  { type: "Car", brand: "Hyundai", model: "i20", variant: "Diesel" },
  { type: "Car", brand: "Hyundai", model: "Creta", variant: "Petrol" },
  { type: "Car", brand: "Maruti Suzuki", model: "Swift", variant: "Petrol" },
  { type: "Car", brand: "Maruti Suzuki", model: "Baleno", variant: "Petrol" },
  { type: "Bike", brand: "Honda", model: "Activa", variant: "110" },
  { type: "Bike", brand: "Honda", model: "Activa", variant: "125" },
  { type: "Bike", brand: "Hero", model: "Splendor", variant: "Plus" },
] as const;

export default function BatteryFinder({
  onSearch,
  availableBrands = [],
}: Props) {
  const [type, setType] = useState<VehicleType>("Car");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [variant, setVariant] = useState("");
  const [batteryBrand, setBatteryBrand] = useState("");

  const manufacturers = useMemo(
    () => [
      ...new Set(
        demoVehicles
          .filter((vehicle) => vehicle.type === type)
          .map((vehicle) => vehicle.brand)
      ),
    ],
    [type]
  );

  const models = useMemo(
    () => [
      ...new Set(
        demoVehicles
          .filter(
            (vehicle) =>
              vehicle.type === type && vehicle.brand === brand
          )
          .map((vehicle) => vehicle.model)
      ),
    ],
    [type, brand]
  );

  const variants = useMemo(
    () => [
      ...new Set(
        demoVehicles
          .filter(
            (vehicle) =>
              vehicle.type === type &&
              vehicle.brand === brand &&
              vehicle.model === model
          )
          .map((vehicle) => vehicle.variant)
      ),
    ],
    [type, brand, model]
  );

  const canSearch = Boolean(brand && model && variant);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSearch) return;

    onSearch({
      type,
      brand,
      model,
      variant,
      batteryBrand,
    });
  }

  return (
    <section
      id="battery-finder"
      aria-labelledby="finder-title"
      className="scroll-mt-28 rounded-[26px] border border-white/90 bg-white/85 p-4 shadow-[0_18px_50px_rgba(21,57,84,0.12),inset_0_1px_0_rgba(255,255,255,0.95)] ring-1 ring-[#89CFF0]/12 backdrop-blur-[18px] sm:p-5 lg:p-6"
    >
      <div className="flex flex-col gap-4 border-b border-[#DCE9F0] pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2
            id="finder-title"
            className="text-[24px] font-extrabold tracking-tight text-[#17364E]"
          >
            Find your battery
          </h2>

          <p className="mt-1 text-sm text-[#647B8D]">
            Select your vehicle details to browse batteries.
          </p>
        </div>
        <VehicleSelector
          type={type}
          onTypeChange={(next) => {
            setType(next);
            setBrand("");
            setModel("");
            setVariant("");
          }}
        />
      </div>

      <form onSubmit={handleSubmit} className="mt-4">
        <div className="grid gap-3 lg:grid-cols-[1.15fr_1fr_1fr_1fr_auto] lg:items-end">
          <SelectField
            id="finder-manufacturer"
            label="Manufacturer"
            value={brand}
            options={manufacturers}
            placeholder="Select manufacturer"
            onChange={(next) => {
              setBrand(next);
              setModel("");
              setVariant("");
            }}
          />

          <SelectField
            id="finder-model"
            label="Model"
            value={model}
            options={models}
            placeholder="Select model"
            disabled={!brand}
            onChange={(next) => {
              setModel(next);
              setVariant("");
            }}
          />

          <SelectField
            id="finder-variant"
            label="Variant / fuel"
            value={variant}
            options={variants}
            placeholder="Select variant"
            disabled={!model}
            onChange={setVariant}
          />

          <SelectField
            id="finder-battery-brand"
            label="Battery brand"
            value={batteryBrand}
            options={availableBrands}
            placeholder="All brands"
            onChange={setBatteryBrand}
          />

          <button
            type="submit"
            disabled={!canSearch}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-[12px] bg-[#50C878] px-5 text-[13px] font-bold text-[#123E29] shadow-[0_4px_12px_rgba(47,151,92,0.14),inset_0_1px_0_rgba(255,255,255,0.4)] transition-colors hover:bg-[#44BD6F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#269B54] disabled:cursor-not-allowed disabled:opacity-45 lg:w-auto lg:min-w-[150px]"
          >
            Find
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </form>

      <p className="mt-3 text-[11px] leading-[17px] text-[#70889A]">
        Demo vehicle list. Exact battery fitment is confirmed before installation.
      </p>
    </section>
  );
}
