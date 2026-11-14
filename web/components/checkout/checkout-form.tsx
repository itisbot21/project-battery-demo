"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";
import { ContactFields } from "./contact-fields";
import { DeliveryFields } from "./delivery-fields";
import { PaymentSection } from "./payment-section";
import type { ConfirmedOrder } from "./order-confirmation";
import type { CartItem } from "@/lib/cart";
import { formatCurrency } from "@/lib/format-currency";

type OrderResponse = {
  success?: boolean;
  orderId?: number;
  totalPaise?: number;
  error?: string;
};

type PinResponse = {
  serviceable?: boolean;
  city?: string | null;
};

type Props = {
  cart: CartItem[];
  totalPaise: number;
  invalidCart: boolean;
  loading: boolean;
  loadError: string;
  confirmedOrder: ConfirmedOrder | null;
  onReload: () => void;
  onConfirmed: (order: ConfirmedOrder) => void;
};

export function CheckoutForm({ cart, totalPaise, invalidCart, loading, loadError, confirmedOrder, onReload, onConfirmed }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const submitLock = useRef(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pin, setPin] = useState("");

  const [verifiedPin, setVerifiedPin] = useState("");
  const [checkingPin, setCheckingPin] = useState(false);
  const [pinMessage, setPinMessage] = useState("");
  const pinRequest = useRef(0);

  const [orderError, setOrderError] = useState("");

  // VALIDATE CUSTOMER DETAILS
  const formValid =
    name.trim().length >= 2 &&
    name.trim().length <= 100 &&
    /^[6-9]\d{9}$/.test(phone) &&
    address.trim().length >= 8 &&
    address.trim().length <= 500 &&
    city.trim().length >= 2 &&
    city.trim().length <= 100 &&
    /^\d{6}$/.test(pin) &&
    verifiedPin === pin &&
    cart.length > 0 &&
    totalPaise > 0 &&
    totalPaise <= 2_000_000_000 &&
    !invalidCart &&
    !loading &&
    !checkingPin &&
    !loadError;

  function changePin(value: string) {
    pinRequest.current += 1;
    setPin(value.replace(/\D/g, "").slice(0, 6));
    setVerifiedPin("");
    setPinMessage("");
    setCheckingPin(false);
  }

  // CHECK DELIVERY PIN
  async function checkPin() {
    if (!/^\d{6}$/.test(pin)) {
      setPinMessage("Enter a valid 6-digit PIN code.");
      return;
    }

    const requestId = ++pinRequest.current;
    const currentPin = pin;

    setCheckingPin(true);
    setVerifiedPin("");
    setPinMessage("");

    try {
      const response = await fetch(
        `/api/serviceability?pin=${encodeURIComponent(currentPin)}`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error("PIN check failed");
      }

      const data: PinResponse = await response.json();

      if (requestId !== pinRequest.current) return;

      if (data.serviceable === true) {
        setVerifiedPin(currentPin);
        setPinMessage("Delivery available for this PIN code.");
      } else {
        setPinMessage(
          "We don't deliver to this PIN code yet."
        );
      }
    } catch {
      if (requestId === pinRequest.current) {
        setPinMessage(
          "Could not check delivery. Please try again."
        );
      }
    } finally {
      if (requestId === pinRequest.current) {
        setCheckingPin(false);
      }
    }
  }

  // SUBMIT ORDER
  async function placeOrder(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !formValid ||
      submitLock.current ||
      confirmedOrder
    ) {
      return;
    }

    submitLock.current = true;
    setSubmitting(true);
    setOrderError("");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer: {
            name: name.trim(),
            phone,
            address: address.trim(),
            city: city.trim(),
            pin,
          },
          items: cart,
          paymentMethod: "cod",
        }),
      });

      const data: OrderResponse = await response
        .json()
        .catch(() => ({}));

      if (
        !response.ok ||
        data.success !== true ||
        typeof data.orderId !== "number" ||
        typeof data.totalPaise !== "number"
      ) {
        throw new Error(
          data.error || "Could not place your order."
        );
      }

      // CLEAR CART ONLY AFTER SERVER SUCCESS
      try {
        localStorage.removeItem("project-battery-cart");
      } catch {
        // Order was already accepted by server.
      }

      onConfirmed({ id: data.orderId, totalPaise: data.totalPaise });
    } catch (caught) {
      setOrderError(
        caught instanceof Error
          ? caught.message
          : "Order failed. Please try again."
      );
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  }
  return (
    <form
      onSubmit={placeOrder}
      className="min-w-0 space-y-5"
    >

      {/* CONTACT INFORMATION */}
      <ContactFields name={name} setName={setName} phone={phone} setPhone={setPhone} />
      <DeliveryFields
        address={address} setAddress={setAddress}
        city={city} setCity={setCity}
        pin={pin} onPinChange={changePin}
        verifiedPin={verifiedPin} checkingPin={checkingPin}
        pinMessage={pinMessage} onCheckPin={() => void checkPin()}
      />
      <PaymentSection />

      {/* ERRORS */}
      {invalidCart && (
        <div
          role="alert"
          className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle
            size={18}
            className="shrink-0"
            aria-hidden="true"
          />

          <div>
            Some cart items are unavailable, exceed
            stock or order limits, or aren&apos;t car/bike
            batteries.{" "}
            <Link
              href="/cart"
              className="font-bold underline"
            >
              Update cart
            </Link>
          </div>
        </div>
      )}

      {loadError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {loadError}

          <button
            type="button"
            onClick={() =>
              onReload()
            }
            className="ml-3 font-bold underline"
          >
            Recheck products
          </button>
        </div>
      )}

      {orderError && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {orderError}
        </p>
      )}

      {/* PLACE ORDER */}
      <button
        type="submit"
        disabled={!formValid || submitting}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#50C878] px-4 text-sm font-extrabold text-[#123E29] shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_4px_12px_rgba(47,151,92,0.16)] hover:bg-[#44BB6F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#268F54] disabled:cursor-not-allowed disabled:opacity-45"
      >
        {submitting
          ? "Placing order..."
          : `Place order · ${formatCurrency(totalPaise)}`}

        {!submitting && (
          <ArrowRight
            size={17}
            aria-hidden="true"
          />
        )}
      </button>

      <p className="text-center text-xs leading-5 text-[#708697]">
        Order is confirmed only after the server
        accepts it. Our team will call to arrange
        delivery.
      </p>
    </form>
  );
}
