"use client";

import { CheckCircle2, MapPin } from "lucide-react";
import { field, label, panel } from "./styles";

type Props = {
  address: string;
  setAddress: (address: string) => void;
  city: string;
  setCity: (city: string) => void;
  pin: string;
  onPinChange: (pin: string) => void;
  verifiedPin: string;
  checkingPin: boolean;
  pinMessage: string;
  onCheckPin: () => void;
};

export function DeliveryFields({ address, setAddress, city, setCity, pin, onPinChange, verifiedPin, checkingPin, pinMessage, onCheckPin }: Props) {
  return (
    <section className={`${panel} p-5 sm:p-6`}>
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E5F3FB] text-[#367FA8]">
          <MapPin
            size={19}
            aria-hidden="true"
          />
        </span>

        <h2 className="text-lg font-extrabold">
          Delivery address
        </h2>
      </div>

      <div className="mt-5 space-y-4">
        <label className={label}>
          Full address
          <textarea
            required
            rows={3}
            maxLength={500}
            autoComplete="street-address"
            value={address}
            onChange={(event) =>
              setAddress(event.target.value)
            }
            placeholder="Flat, building, street and locality"
            className={`${field} resize-y`}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className={label}>
            City
            <input
              required
              autoComplete="address-level2"
              maxLength={100}
              value={city}
              onChange={(event) =>
                setCity(event.target.value)
              }
              placeholder="Mumbai or Navi Mumbai"
              className={field}
            />
          </label>

          <label className={label}>
            6-digit PIN code
            <input
              required
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={6}
              value={pin}
              onChange={(event) => onPinChange(event.target.value)}
              placeholder="400001"
              className={field}
            />
          </label>
        </div>

        {/* DELIVERY VERIFICATION */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={
              checkingPin || pin.length !== 6
            }
            onClick={onCheckPin}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-[#B6DBEC] bg-[#E6F5FC]/80 px-4 text-xs font-bold text-[#245A79] hover:bg-[#D9F0FB] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {checkingPin
              ? "Checking..."
              : verifiedPin === pin
                ? "Check again"
                : "Check availability"}
          </button>

          {pinMessage && (
            <p
              aria-live="polite"
              className={`flex items-center gap-1.5 text-xs font-medium ${verifiedPin === pin
                ? "text-[#267D4D]"
                : "text-[#A04943]"
                }`}
            >
              {verifiedPin === pin && (
                <CheckCircle2
                  size={15}
                  aria-hidden="true"
                />
              )}
              {pinMessage}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
