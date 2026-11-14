
"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BatteryFull,
  CheckCircle2,
  CreditCard,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Truck,
  Wallet,
  Wrench,
} from "lucide-react";

import StorefrontNav from "@/components/storefront-nav";
import { getCart, type CartItem } from "@/lib/cart";

type Product = {
  id: number;
  brand: string;
  model: string;
  category: string;
  stock: number;
  active: boolean;
  withExchangePaise: number;
  withoutExchangePaise: number;
};

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

const panel =
  "rounded-[20px] border border-white/85 bg-white/60 shadow-[0_12px_32px_rgba(32,72,102,0.07),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-[#89CFF0]/10 backdrop-blur-[18px]";

const field =
  "mt-1.5 block w-full rounded-xl border border-[#D0E1EA] bg-white/75 px-3.5 py-3 text-sm text-[#17364E] outline-none placeholder:text-[#9AADBA] focus:border-[#70B9DC] focus:ring-2 focus:ring-[#89CFF0]/30";

const label =
  "block text-[13px] font-semibold text-[#35556D]";

function money(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(paise / 100);
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
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

  const [loadError, setLoadError] = useState("");
  const [orderError, setOrderError] = useState("");

  const [confirmedOrder, setConfirmedOrder] = useState<{
    id: number;
    totalPaise: number;
  } | null>(null);

  // LOAD CART AND CURRENT PRODUCT DATA
  useEffect(() => {
    setCart(getCart());

    const controller = new AbortController();

    async function loadProducts() {
      setLoading(true);
      setLoadError("");

      try {
        const response = await fetch("/api/products", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to load batteries.");
        }

        const data: unknown = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Invalid product response.");
        }

        if (!controller.signal.aborted) {
          setProducts(data as Product[]);
        }
      } catch {
        if (!controller.signal.aborted) {
          setLoadError(
            "We couldn't check current prices and stock. Please retry."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadProducts();

    return () => controller.abort();
  }, [reloadKey]);

  // BUILD ORDER ROWS
  const rows = useMemo(() => {
    const byId = new Map(
      products.map((product) => [product.id, product])
    );

    return cart.map((item) => {
      const product = byId.get(item.productId);

      const unitPrice = product
        ? item.exchange === "with"
          ? product.withExchangePaise
          : product.withoutExchangePaise
        : 0;

      return {
        item,
        product,
        unitPrice,
        subtotal: unitPrice * item.quantity,
      };
    });
  }, [cart, products]);

  const totalItems = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const totalPaise = rows.reduce(
    (sum, row) => sum + row.subtotal,
    0
  );

  const quantityById = new Map<number, number>();
  const quantityByLine = new Map<string, number>();

  for (const item of cart) {
    quantityById.set(
      item.productId,
      (quantityById.get(item.productId) ?? 0) +
      item.quantity
    );

    const key = `${item.productId}:${item.exchange}`;

    quantityByLine.set(
      key,
      (quantityByLine.get(key) ?? 0) + item.quantity
    );
  }

  // VALIDATE CART BEFORE CHECKOUT
  const invalidCart =
    cart.length > 20 ||
    totalItems > 30 ||
    [...quantityByLine.values()].some(
      (quantity) => quantity > 10
    ) ||
    rows.some(
      ({ product, unitPrice, subtotal }) =>
        !product ||
        product.active === false ||
        !["Car", "Bike"].includes(product.category) ||
        !Number.isSafeInteger(unitPrice) ||
        unitPrice < 0 ||
        product.withoutExchangePaise <
        product.withExchangePaise ||
        !Number.isSafeInteger(subtotal) ||
        (quantityById.get(product.id) ?? 0) > product.stock
    );

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

      setConfirmedOrder({
        id: data.orderId,
        totalPaise: data.totalPaise,
      });

      setCart([]);
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
    <main className="relative min-h-screen overflow-x-clip bg-[#F6FAFC] text-[#17364E]">

      {/* BACKGROUND */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[560px] overflow-hidden"
      >
        <div className="absolute -left-40 top-0 h-[410px] w-[410px] rounded-full bg-[#89CFF0]/20 blur-[110px]" />

        <div className="absolute -right-32 top-10 h-[350px] w-[350px] rounded-full bg-[#89CFF0]/10 blur-[110px]" />
      </div>

      {/* SHARED NAVBAR */}
      <StorefrontNav />

      <div className="relative z-10 mx-auto max-w-[1160px] px-5 pb-20 pt-10 sm:px-8 sm:pt-14">

        {confirmedOrder ? (
          // ORDER SUCCESS
          <section
            className={`${panel} mx-auto max-w-[590px] px-6 py-10 text-center sm:p-12`}
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[18px] bg-[#E5F8ED] text-[#2C9A61]">
              <CheckCircle2
                size={34}
                aria-hidden="true"
              />
            </div>

            <h1 className="mt-5 font-heading text-3xl font-extrabold tracking-tight">
              Order placed
            </h1>

            <p className="mt-2 text-sm leading-6 text-[#637D90]">
              Your order is received. Our team will contact
              you to confirm delivery timing.
            </p>

            <div className="mt-7 grid gap-4 rounded-[16px] border border-white/85 bg-[#EAF5FB]/65 p-5 sm:grid-cols-2">
              <div>
                <p className="text-xs text-[#667F91]">
                  Order number
                </p>

                <p className="mt-1 text-xl font-extrabold">
                  #{confirmedOrder.id}
                </p>
              </div>

              <div>
                <p className="text-xs text-[#667F91]">
                  Pay on delivery
                </p>

                <p className="mt-1 text-xl font-extrabold">
                  {money(confirmedOrder.totalPaise)}
                </p>
              </div>
            </div>

            <p className="mt-5 text-xs leading-5 text-[#667F91]">
              Cash on Delivery · Old battery exchange eligibility
              is checked at delivery. An ineligible exchange
              may increase the amount due.
            </p>

            <Link
              href="/"
              className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#89CFF0] px-6 text-sm font-bold text-[#17364E] hover:bg-[#75C5EB]"
            >
              Back to home
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </section>
        ) : (
          <>
            {/* PAGE HEADING */}
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#398DB9]">
                  Your order
                </p>

                <h1 className="mt-2 font-heading text-[clamp(2rem,3vw,2.75rem)] font-extrabold tracking-[-0.04em]">
                  Checkout
                </h1>

                <p className="mt-1 text-sm text-[#678093]">
                  Enter your details to request doorstep
                  delivery and installation.
                </p>
              </div>

              <Link
                href="/cart"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#D0E2EC] bg-white/70 px-4 text-[13px] font-semibold text-[#315A73] hover:bg-white"
              >
                <ArrowLeft size={16} aria-hidden="true" />
                Back to cart
              </Link>
            </div>

            {loading ? (
              <div
                role="status"
                className={`${panel} mt-7 p-8 text-sm text-[#688092]`}
              >
                Checking your cart and prices...
              </div>
            ) : cart.length === 0 ? (
              // EMPTY CART
              <div
                className={`${panel} mt-7 px-6 py-12 text-center`}
              >
                <BatteryFull
                  size={40}
                  className="mx-auto text-[#398DB9]"
                  aria-hidden="true"
                />

                <h2 className="mt-3 text-lg font-bold">
                  Your cart is empty
                </h2>

                <p className="mt-2 text-sm text-[#678093]">
                  Add a car or bike battery before checking out.
                </p>

                <Link
                  href="/#products"
                  className="mt-5 inline-flex h-11 items-center rounded-xl bg-[#89CFF0] px-5 text-sm font-bold text-[#17364E]"
                >
                  Browse batteries
                </Link>
              </div>
            ) : (
              // CHECKOUT LAYOUT
              <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-7">

                {/* LEFT: CHECKOUT FORM */}
                <form
                  onSubmit={placeOrder}
                  className="min-w-0 space-y-5"
                >

                  {/* CONTACT INFORMATION */}
                  <section className={`${panel} p-5 sm:p-6`}>
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E5F3FB] text-[#367FA8]">
                        <ShieldCheck
                          size={19}
                          aria-hidden="true"
                        />
                      </span>

                      <h2 className="text-lg font-extrabold">
                        Contact information
                      </h2>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <label className={label}>
                        Full name
                        <input
                          required
                          autoComplete="name"
                          maxLength={100}
                          value={name}
                          onChange={(event) =>
                            setName(event.target.value)
                          }
                          placeholder="Your full name"
                          className={field}
                        />
                      </label>

                      <label className={label}>
                        Mobile number
                        <input
                          required
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel-national"
                          maxLength={10}
                          value={phone}
                          onChange={(event) =>
                            setPhone(
                              event.target.value
                                .replace(/\D/g, "")
                                .slice(0, 10)
                            )
                          }
                          placeholder="10-digit mobile number"
                          className={field}
                        />
                      </label>
                    </div>
                  </section>

                  {/* DELIVERY ADDRESS */}
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
                            onChange={(event) => {
                              pinRequest.current += 1;

                              setPin(
                                event.target.value
                                  .replace(/\D/g, "")
                                  .slice(0, 6)
                              );

                              setVerifiedPin("");
                              setPinMessage("");
                              setCheckingPin(false);
                            }}
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
                          onClick={() => void checkPin()}
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

                  {/* PAYMENT METHOD */}
                  <section className={`${panel} p-5 sm:p-6`}>
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E5F3FB] text-[#367FA8]">
                        <Wallet
                          size={19}
                          aria-hidden="true"
                        />
                      </span>

                      <h2 className="text-lg font-extrabold">
                        Payment
                      </h2>
                    </div>

                    <div className="mt-5 flex items-start gap-3 rounded-[14px] border border-[#A5DFC1] bg-[#EAF8F0]/70 p-4">
                      <span
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[5px] border-[#50C878] bg-white"
                        aria-hidden="true"
                      />

                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#174F34]">
                          Cash on Delivery
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[#4F7964]">
                          Pay when your battery is delivered.
                          No online payment is collected.
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 flex items-center gap-2 text-xs text-[#788C9A]">
                      <CreditCard
                        size={15}
                        aria-hidden="true"
                      />
                      UPI, cards and advance payments are
                      not available yet.
                    </p>
                  </section>

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
                        stock or order limits, or aren't car/bike
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
                          setReloadKey((key) => key + 1)
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
                      : `Place order · ${money(totalPaise)}`}

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

                {/* RIGHT: ORDER SUMMARY */}
                <aside
                  className={`${panel} min-w-0 p-5 sm:p-6 lg:sticky lg:top-32`}
                >
                  <h2 className="text-lg font-extrabold">
                    Order summary
                  </h2>

                  <p className="mt-1 text-xs text-[#7890A1]">
                    {totalItems}{" "}
                    {totalItems === 1
                      ? "battery"
                      : "batteries"}{" "}
                    · GST included
                  </p>

                  {/* ORDER ITEMS */}
                  <div className="mt-5 space-y-4">
                    {rows.map(
                      ({ item, product, subtotal }) => (
                        <div
                          key={`${item.productId}-${item.exchange}`}
                          className="flex items-start gap-3 border-b border-[#DDEAF1] pb-4 last:border-0 last:pb-0"
                        >
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E8F5FB] text-[#3689B6]">
                            <BatteryFull
                              size={28}
                              strokeWidth={1.5}
                              aria-hidden="true"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-bold leading-5">
                              {product
                                ? `${product.brand} ${product.model}`
                                : "Battery unavailable"}
                            </p>

                            <p className="mt-1 text-[11px] leading-4 text-[#718797]">
                              Qty {item.quantity} ·{" "}
                              {item.exchange === "with"
                                ? "With exchange"
                                : "Without exchange"}
                            </p>

                            <p className="mt-1.5 text-[13px] font-bold tabular-nums">
                              {product
                                ? money(subtotal)
                                : "—"}
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  {/* PRICING */}
                  <div className="mt-5 space-y-3 text-[13px]">
                    <div className="flex items-center justify-between text-[#617B8E]">
                      <span>Subtotal</span>
                      <span className="font-semibold text-[#25475F]">
                        {invalidCart
                          ? "—"
                          : money(totalPaise)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[#617B8E]">
                      <span className="flex items-center gap-1.5">
                        <Truck
                          size={15}
                          aria-hidden="true"
                        />
                        Delivery
                      </span>

                      <span className="font-bold text-[#27965B]">
                        FREE
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[#617B8E]">
                      <span className="flex items-center gap-1.5">
                        <Wrench
                          size={15}
                          aria-hidden="true"
                        />
                        Installation
                      </span>

                      <span className="font-bold text-[#27965B]">
                        FREE
                      </span>
                    </div>
                  </div>

                  {/* TOTAL */}
                  <div className="mt-5 flex items-center justify-between border-t border-[#DDEAF1] pt-4">
                    <span className="text-sm font-extrabold">
                      Total
                    </span>

                    <span className="text-xl font-extrabold tabular-nums">
                      {invalidCart
                        ? "—"
                        : money(totalPaise)}
                    </span>
                  </div>

                  {/* PAYMENT BREAKDOWN */}
                  <div className="mt-4 rounded-xl bg-[#EAF5FB]/75 px-3 py-3 text-xs leading-5 text-[#587589]">
                    <div className="flex justify-between">
                      <span>Pay now</span>
                      <strong>{money(0)}</strong>
                    </div>

                    <div className="mt-1.5 flex justify-between">
                      <span>Pay on delivery</span>
                      <strong>
                        {invalidCart
                          ? "—"
                          : money(totalPaise)}
                      </strong>
                    </div>
                  </div>

                  <p className="mt-4 text-[11px] leading-5 text-[#718797]">
                    Old battery exchange is checked at
                    delivery. If the old battery isn't eligible,
                    you'll pay the difference.
                  </p>

                  <div className="mt-4 flex items-center gap-2 border-t border-[#DDEAF1] pt-4 text-[11px] text-[#5E7E90]">
                    <PackageCheck
                      size={16}
                      className="text-[#319C67]"
                      aria-hidden="true"
                    />
                    Free doorstep installation
                  </div>
                </aside>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}