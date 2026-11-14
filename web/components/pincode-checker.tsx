
"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  XCircle,
  AlertCircle,
} from "lucide-react";

type CheckResult = {
  pin: string;
  serviceable: boolean;
  city: string | null;
};

export default function PincodeChecker() {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] =
    useState<CheckResult | null>(null);
  const [error, setError] = useState("");

  const requestId = useRef(0);

  useEffect(() => {
    return () => {
      requestId.current += 1;
    };
  }, []);

  function changePin(value: string) {
    requestId.current += 1;

    setPin(value.replace(/\D/g, "").slice(0, 6));
    setResult(null);
    setError("");
    setLoading(false);
  }

  async function checkAvailability(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!/^\d{6}$/.test(pin)) {
      setError("Enter a valid 6-digit PIN code.");
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

      const data: unknown = await response.json();

      if (
        !data ||
        typeof data !== "object" ||
        !("serviceable" in data) ||
        typeof data.serviceable !== "boolean"
      ) {
        throw new Error("Unexpected delivery response");
      }

      if (currentRequest === requestId.current) {
        setResult({
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
        setError(
          "Couldn't check delivery right now. Please try again."
        );
      }
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
      }
    }
  }

  return (
    <div className="relative p-5 sm:p-6">
      <div className="grid items-center gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,470px)] lg:gap-10">

        {/* LEFT: HEADING */}
        <div className="flex min-w-0 items-start gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-white/80 bg-[#89CFF0]/40 text-[#266C95] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            <MapPin
              size={21}
              strokeWidth={1.9}
              aria-hidden="true"
            />
          </span>

          <div className="min-w-0">
            <h2 className="text-[19px] font-extrabold leading-7 tracking-[-0.035em] text-[#17364E] sm:text-[21px]">
              Check delivery availability
            </h2>

            <p className="mt-0.5 text-[13px] leading-5 text-[#617B8E]">
              Enter your PIN code to see if we deliver
              to your address.
            </p>
          </div>
        </div>

        {/* RIGHT: PIN-CODE FORM */}
        <form
          onSubmit={checkAvailability}
          className="min-w-0"
        >
          <label
            htmlFor="delivery-pin"
            className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.06em] text-[#657F91]"
          >
            Delivery PIN code
          </label>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="delivery-pin"
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={6}
              pattern="[0-9]{6}"
              placeholder="6-digit PIN code"
              value={pin}
              onChange={(event) =>
                changePin(event.target.value)
              }
              aria-invalid={Boolean(error)}
              className="h-11 w-full min-w-0 flex-1 rounded-[12px] border border-[#CADFEA] bg-white/80 px-3.5 text-[14px] text-[#17364E] outline-none placeholder:text-[#90A5B4] focus:border-[#61ACD1] focus:ring-2 focus:ring-[#89CFF0]/30 aria-invalid:border-rose-300"
            />

            <button
              type="submit"
              disabled={pin.length !== 6 || loading}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[12px] bg-[#50C878] px-5 text-[13px] font-bold text-[#123E29] shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_3px_10px_rgba(32,132,74,0.12)] transition-colors hover:bg-[#44BC6F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C9656] disabled:cursor-not-allowed disabled:opacity-45 sm:min-w-[160px]"
            >
              {loading
                ? "Checking..."
                : "Check delivery"}

              {!loading && (
                <ArrowRight
                  size={16}
                  aria-hidden="true"
                />
              )}
            </button>
          </div>
        </form>
      </div>

      {/* AVAILABILITY RESULT */}
      {result && (
        <div
          role="status"
          className={`mt-4 flex items-start gap-2.5 rounded-[12px] border px-3.5 py-3 text-[13px] leading-5 ${result.serviceable
              ? "border-[#BCEACF] bg-[#EAF9F0]/80 text-[#236C45]"
              : "border-[#F1D7D5] bg-[#FFF3F1]/85 text-[#995047]"
            }`}
        >
          {result.serviceable ? (
            <CheckCircle2
              size={18}
              className="mt-0.5 shrink-0"
              aria-hidden="true"
            />
          ) : (
            <XCircle
              size={18}
              className="mt-0.5 shrink-0"
              aria-hidden="true"
            />
          )}

          <p>
            {result.serviceable ? (
              <>
                <strong>Delivery available</strong> for
                PIN {result.pin}
                {result.city
                  ? ` (${result.city})`
                  : ""}
                . Delivery and installation are free.
              </>
            ) : (
              <>
                We don&apos;t currently deliver to{" "}
                <strong>PIN {result.pin}</strong>. Try
                another PIN code.
              </>
            )}
          </p>
        </div>
      )}

      {/* NETWORK / VALIDATION ERROR */}
      {error && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2.5 rounded-[12px] border border-amber-200 bg-amber-50 px-3.5 py-3 text-[13px] text-amber-900"
        >
          <AlertCircle
            size={18}
            className="shrink-0"
            aria-hidden="true"
          />

          <p>{error}</p>
        </div>
      )}
    </div>
  );
}