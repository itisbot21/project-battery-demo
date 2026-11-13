
"use client";

import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CheckResult = {
  pin: string;
  serviceable: boolean;
  city: string | null;
};

export default function PincodeChecker() {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(
    null
  );
  const [error, setError] = useState("");

  const requestId = useRef(0);

  function changePin(value: string) {
    requestId.current += 1;

    // Accept only six numeric digits
    setPin(value.replace(/\D/g, "").slice(0, 6));

    setResult(null);
    setError("");
    setLoading(false);
  }

  async function checkAvailability(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!/^\d{6}$/.test(pin)) {
      setError("Please enter a valid 6-digit PIN code.");
      return;
    }

    const currentRequest = ++requestId.current;
    const checkedPin = pin;

    setLoading(true);
    setResult(null);
    setError("");

    try {
      const response = await fetch(
        `/api/serviceability?pin=${encodeURIComponent(checkedPin)}`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error("Delivery check failed");
      }

      const data = await response.json();

      if (typeof data.serviceable !== "boolean") {
        throw new Error("Invalid response");
      }

      if (currentRequest === requestId.current) {
        setResult({
          pin: checkedPin,
          serviceable: data.serviceable,
          city: typeof data.city === "string"
            ? data.city
            : null,
        });
      }
    } catch {
      if (currentRequest === requestId.current) {
        setError(
          "Unable to check delivery right now. Please try again."
        );
      }
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
      }
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-8">
      <div className="rounded-2xl border bg-white p-6 shadow-sm md:p-8">

        <div className="flex items-center gap-3">
          <span className="text-3xl">📍</span>

          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Check Delivery Availability
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Free delivery and installation in our
              serviceable areas.
            </p>
          </div>
        </div>

        <form
          onSubmit={checkAvailability}
          className="mt-6 flex max-w-xl flex-col gap-3 sm:flex-row"
        >
          <Input
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={6}
            aria-label="Delivery PIN code"
            placeholder="Enter your 6-digit PIN code"
            value={pin}
            onChange={(e) => changePin(e.target.value)}
            className="h-12 bg-white text-slate-900"
          />

          <Button
            type="submit"
            disabled={pin.length !== 6 || loading}
            className="h-12 px-8"
          >
            {loading ? "Checking..." : "Check Delivery"}
          </Button>
        </form>

        <div aria-live="polite" className="mt-5">
          {result?.serviceable && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-5">
              <p className="font-bold text-green-800">
                ✅ Delivery Available!
              </p>

              <p className="mt-2 text-sm text-green-800">
                Great news! We deliver to PIN code{" "}
                <strong>{result.pin}</strong>
                {result.city ? ` (${result.city})` : ""}.
              </p>

              <p className="mt-2 text-sm text-green-700">
                Free doorstep delivery and battery installation.
              </p>
            </div>
          )}

          {result && !result.serviceable && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5">
              <p className="font-bold text-red-800">
                ❌ Delivery Not Available
              </p>

              <p className="mt-2 text-sm text-red-700">
                Sorry, we currently don't deliver to PIN code{" "}
                <strong>{result.pin}</strong>.
              </p>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
            >
              {error}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
