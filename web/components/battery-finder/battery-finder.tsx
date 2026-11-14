
"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  ArrowRight,
  Bike,
  CarFront,
  CheckCircle2,
  MapPin,
  XCircle,
} from "lucide-react";

import { SelectField } from "./finder-select";

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

type VehicleType = "Car" | "Bike";
type ActiveTab = VehicleType | "Delivery";

type DeliveryResult = {
  pin: string;
  serviceable: boolean;
  city: string | null;
};

// Temporary vehicle data, not verified battery fitment.
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
  const [activeTab, setActiveTab] = useState<ActiveTab>("Car");

  // Vehicle finder state
  const [type, setType] = useState<VehicleType>("Car");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [variant, setVariant] = useState("");
  const [batteryBrand, setBatteryBrand] = useState("");

  // Delivery checker state
  const [pin, setPin] = useState("");
  const [checking, setChecking] = useState(false);
  const [deliveryResult, setDeliveryResult] =
    useState<DeliveryResult | null>(null);
  const [deliveryError, setDeliveryError] = useState("");

  const requestId = useRef(0);

  useEffect(() => {
    return () => {
      requestId.current += 1;
    };
  }, []);

  // VEHICLE OPTIONS
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
              vehicle.type === type &&
              vehicle.brand === brand
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

  function selectVehicle(next: VehicleType) {
    setActiveTab(next);

    requestId.current += 1;
    setChecking(false);

    if (type !== next) {
      setType(next);
      setBrand("");
      setModel("");
      setVariant("");
    }
  }

  function selectDelivery() {
    setActiveTab("Delivery");
  }

  // BATTERY FINDER SUBMISSION
  function handleVehicleSearch(
    event: FormEvent<HTMLFormElement>
  ) {
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

  // PIN CHANGE
  function changePin(value: string) {
    requestId.current += 1;

    setPin(value.replace(/\D/g, "").slice(0, 6));
    setChecking(false);
    setDeliveryResult(null);
    setDeliveryError("");
  }

  // DELIVERY API CHECK
  async function checkDelivery(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!/^\d{6}$/.test(pin)) {
      setDeliveryError("Enter a valid 6-digit PIN code.");
      return;
    }

    const currentRequest = ++requestId.current;
    const checkedPin = pin;

    setChecking(true);
    setDeliveryResult(null);
    setDeliveryError("");

    try {
      const response = await fetch(
        `/api/serviceability?pin=${encodeURIComponent(checkedPin)}`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error("Unable to check delivery");
      }

      const data: unknown = await response.json();

      if (
        !data ||
        typeof data !== "object" ||
        !("serviceable" in data) ||
        typeof data.serviceable !== "boolean"
      ) {
        throw new Error("Invalid delivery response");
      }

      if (currentRequest === requestId.current) {
        setDeliveryResult({
          pin: checkedPin,
          serviceable: data.serviceable,
          city:
            "city" in data &&
              typeof data.city === "string"
              ? data.city
              : null,
        });
      }
    } catch {
      if (currentRequest === requestId.current) {
        setDeliveryError(
          "Couldn't check delivery right now. Please try again."
        );
      }
    } finally {
      if (currentRequest === requestId.current) {
        setChecking(false);
      }
    }
  }

  return (
    <section
      id="battery-finder"
      aria-label="Find batteries and check delivery"
      className="scroll-mt-28 rounded-[22px] border border-white/90 bg-white/85 p-4 shadow-[0_18px_50px_rgba(21,57,84,0.10),inset_0_1px_0_rgba(255,255,255,0.95)] ring-1 ring-[#89CFF0]/10 backdrop-blur-[18px] sm:p-5 lg:p-6"
    >
      {/* TOP TABS */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DCE9F0] pb-4">

        {/* LEFT — CAR & BIKE */}
        <div
          role="group"
          aria-label="Vehicle type"
          className="inline-flex items-center gap-1 rounded-[13px] bg-[#EEF4F7] p-1"
        >
          {(
            [
              { label: "Car", icon: CarFront },
              { label: "Bike", icon: Bike },
            ] as const
          ).map(({ label, icon: Icon }) => {
            const active = activeTab === label;

            return (
              <button
                key={label}
                type="button"
                aria-pressed={active}
                onClick={() => selectVehicle(label)}
                className={`flex h-10 min-w-[82px] items-center justify-center gap-2 rounded-[10px] px-3 text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#398DB9] sm:min-w-[120px] ${active
                    ? "bg-[#50C878] text-[#123E29] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
                    : "text-[#536D80] hover:bg-white/70"
                  }`}
              >
                <Icon size={17} aria-hidden="true" />
                {label}
              </button>
            );
          })}
        </div>

        {/* RIGHT — DELIVERY */}
        <button
          type="button"
          aria-pressed={activeTab === "Delivery"}
          onClick={selectDelivery}
          className={`inline-flex h-11 items-center justify-center gap-2 rounded-[12px] border px-3.5 text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#398DB9] sm:px-5 ${activeTab === "Delivery"
              ? "border-[#50C878] bg-[#50C878] text-[#123E29]"
              : "border-[#D4E5ED] bg-white/65 text-[#42647A] hover:border-[#89CFF0] hover:bg-white"
            }`}
        >
          <MapPin size={17} aria-hidden="true" />

          <span className="sm:hidden">Delivery</span>

          <span className="hidden sm:inline">
            Delivery Availability
          </span>
        </button>
      </div>

      {/* CAR / BIKE BATTERY FINDER */}
      {activeTab !== "Delivery" && (
        <>
          <form
            onSubmit={handleVehicleSearch}
            className="mt-5"
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.15fr_1fr_1fr_1fr_auto] lg:items-end">

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
                className="flex h-11 w-full items-center justify-center gap-2 rounded-[12px] bg-[#50C878] px-5 text-[13px] font-bold text-[#123E29] shadow-[0_4px_12px_rgba(47,151,92,0.14)] transition-colors hover:bg-[#44BD6F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#269B54] disabled:cursor-not-allowed disabled:opacity-45 lg:min-w-[140px]"
              >
                Find
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          </form>

          <p className="mt-3 text-[11px] leading-[17px] text-[#70889A]">
            Demo vehicle list. Exact battery fitment is
            confirmed before installation.
          </p>
        </>
      )}

      {/* DELIVERY AVAILABILITY */}
      {activeTab === "Delivery" && (
        <div className="mt-5">
          <form onSubmit={checkDelivery}>
            <label
              htmlFor="finder-delivery-pin"
              className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#647A8C]"
            >
              Delivery PIN code
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="finder-delivery-pin"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={pin}
                onChange={(event) =>
                  changePin(event.target.value)
                }
                placeholder="Enter your 6-digit PIN code"
                className="h-11 w-full min-w-0 flex-1 rounded-[12px] border border-[#D4E2EA] bg-white/90 px-4 text-[13px] text-[#1D3A52] outline-none placeholder:text-[#95A7B4] focus:border-[#50C878] focus:ring-2 focus:ring-[#50C878]/20"
              />

              <button
                type="submit"
                disabled={pin.length !== 6 || checking}
                className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-[12px] bg-[#50C878] px-6 text-[13px] font-bold text-[#123E29] transition-colors hover:bg-[#44BD6F] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {checking
                  ? "Checking..."
                  : "Check Delivery"}

                {!checking && (
                  <ArrowRight size={16} aria-hidden="true" />
                )}
              </button>
            </div>
          </form>

          {/* DELIVERY RESULT */}
          <div aria-live="polite" className="mt-3">
            {deliveryResult && (
              <div
                role="status"
                className={`flex items-start gap-2 rounded-[12px] px-3.5 py-3 text-[13px] ${deliveryResult.serviceable
                    ? "bg-[#E8F8EF] text-[#236E46]"
                    : "bg-[#FFF0EE] text-[#994F47]"
                  }`}
              >
                {deliveryResult.serviceable ? (
                  <CheckCircle2
                    size={18}
                    className="shrink-0"
                    aria-hidden="true"
                  />
                ) : (
                  <XCircle
                    size={18}
                    className="shrink-0"
                    aria-hidden="true"
                  />
                )}

                <span>
                  {deliveryResult.serviceable ? (
                    <>
                      Delivery available for PIN{" "}
                      <strong>{deliveryResult.pin}</strong>
                      {deliveryResult.city
                        ? ` (${deliveryResult.city})`
                        : ""}
                      . Delivery and installation are free.
                    </>
                  ) : (
                    <>
                      Delivery is not currently available
                      for PIN{" "}
                      <strong>{deliveryResult.pin}</strong>.
                    </>
                  )}
                </span>
              </div>
            )}

            {deliveryError && (
              <p
                role="alert"
                className="rounded-[12px] bg-amber-50 px-3.5 py-3 text-[13px] text-amber-900"
              >
                {deliveryError}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}