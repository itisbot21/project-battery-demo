
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCart, type CartItem } from "@/lib/cart";

type Product = {
  id: number;
  brand: string;
  model: string;
  stock: number;
  withExchangePaise: number;
  withoutExchangePaise: number;
};

type OrderResponse = {
  success?: boolean;
  orderId?: number;
  totalPaise?: number;
  error?: string;
};

function formatPrice(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(paise / 100);
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checkingPin, setCheckingPin] = useState(false);

  const [error, setError] = useState("");
  const [pinMessage, setPinMessage] = useState("");
  const [verifiedPin, setVerifiedPin] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pin, setPin] = useState("");

  const [confirmedOrder, setConfirmedOrder] = useState<{
    id: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    setCart(getCart());

    const controller = new AbortController();

    async function loadProducts() {
      try {
        const response = await fetch("/api/products", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to load products.");
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
          setError("Unable to load products. Refresh the page.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => controller.abort();
  }, []);

  async function checkPin() {
    if (!/^\d{6}$/.test(pin)) {
      setPinMessage("Enter a valid 6-digit PIN code.");
      return;
    }

    setCheckingPin(true);
    setVerifiedPin("");
    setPinMessage("");

    const requestedPin = pin;

    try {
      const response = await fetch(
        `/api/serviceability?pin=${requestedPin}`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error("Delivery verification failed.");
      }

      const data = await response.json();

      if (data.serviceable === true) {
        setVerifiedPin(requestedPin);
        setPinMessage("✅ Delivery available!");
      } else {
        setPinMessage("Delivery is unavailable for this PIN.");
      }
    } catch {
      setPinMessage("Could not check delivery availability.");
    } finally {
      setCheckingPin(false);
    }
  }

  const cartRows = cart.map((item) => {
    const product = products.find(
      (p) => p.id === item.productId
    );

    const price = product
      ? item.exchange === "with"
        ? product.withExchangePaise
        : product.withoutExchangePaise
      : 0;

    return {
      item,
      product,
      subtotal: price * item.quantity,
    };
  });

  const totalPaise = cartRows.reduce(
    (sum, row) => sum + row.subtotal,
    0
  );

  const hasStockIssue = cartRows.some(({ item, product }) => {
    if (!product || product.stock <= 0) return true;

    const requested = cart
      .filter((i) => i.productId === item.productId)
      .reduce((sum, i) => sum + i.quantity, 0);

    return requested > product.stock;
  });

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
    !hasStockIssue &&
    !loading &&
    !checkingPin &&
    !error;

  async function placeOrder() {
    if (!formValid || submitting || confirmedOrder) return;

    setSubmitting(true);
    setError("");

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

      const data: OrderResponse = await response.json();

      if (
        !response.ok ||
        data.success !== true ||
        typeof data.orderId !== "number" ||
        typeof data.totalPaise !== "number"
      ) {
        throw new Error(
          data.error || "Unable to place order."
        );
      }

      // Clear cart only after server confirms the order.
      localStorage.removeItem("project-battery-cart");

      setConfirmedOrder({
        id: data.orderId,
        total: data.totalPaise,
      });

      setCart([]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const fieldClass =
    "mt-2 w-full rounded-lg border border-slate-300 bg-white p-3 outline-none focus:border-orange-500";

  if (confirmedOrder) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-lg rounded-2xl border bg-white p-8 text-center shadow-sm">
          <div className="text-5xl">✅</div>

          <h1 className="mt-5 text-3xl font-bold">
            Order Placed!
          </h1>

          <p className="mt-4 text-slate-600">
            Your order has been saved successfully.
          </p>

          <div className="mt-6 rounded-xl bg-slate-100 p-6">
            <p className="text-sm text-slate-500">
              Order Number
            </p>

            <p className="mt-2 text-2xl font-bold">
              #{confirmedOrder.id}
            </p>

            <p className="mt-5 text-sm text-slate-500">
              Order Total
            </p>

            <p className="mt-2 text-2xl font-bold text-green-700">
              {formatPrice(confirmedOrder.total)}
            </p>

            <p className="mt-3 font-medium">
              Payment: Cash on Delivery
            </p>
          </div>

          <p className="mt-6 text-sm text-slate-500">
            Our staff will contact you to confirm delivery.
            Old battery exchange eligibility will be checked
            at delivery.
          </p>

          <Link href="/">
            <Button className="mt-8 w-full bg-orange-600 hover:bg-orange-700">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-xl font-extrabold">
            PROJECT
            <span className="text-orange-600">BATTERY</span>
          </Link>

          <Link href="/cart" className="text-orange-600">
            Back to Cart
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-bold">
          Secure Checkout
        </h1>

        <p className="mt-2 text-slate-500">
          Free doorstep delivery and installation in
          Mumbai and Navi Mumbai.
        </p>

        {loading && (
          <p className="mt-8">Loading checkout...</p>
        )}

        {!loading && cart.length === 0 && (
          <div className="mt-8 rounded-xl border bg-white p-8">
            Your cart is empty.
            <Link href="/" className="ml-2 text-orange-600">
              Shop Batteries
            </Link>
          </div>
        )}

        {!loading && cart.length > 0 && (
          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            <form
              className="space-y-6 lg:col-span-2"
              onSubmit={(e) => {
                e.preventDefault();
                void placeOrder();
              }}
            >
              <section className="rounded-2xl border bg-white p-6">
                <h2 className="text-xl font-bold">
                  1. Customer Information
                </h2>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-medium">
                    Full Name
                    <input
                      required
                      className={fieldClass}
                      value={name}
                      maxLength={100}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                    />
                  </label>

                  <label className="text-sm font-medium">
                    Mobile Number
                    <input
                      required
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      className={fieldClass}
                      value={phone}
                      onChange={(e) =>
                        setPhone(
                          e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 10)
                        )
                      }
                      placeholder="10-digit mobile number"
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-2xl border bg-white p-6">
                <h2 className="text-xl font-bold">
                  2. Delivery Address
                </h2>

                <label className="mt-5 block text-sm font-medium">
                  Complete Address
                  <textarea
                    required
                    rows={3}
                    maxLength={500}
                    className={fieldClass}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Flat, building, street and area"
                  />
                </label>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-medium">
                    City
                    <input
                      required
                      className={fieldClass}
                      value={city}
                      maxLength={100}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Mumbai / Navi Mumbai"
                    />
                  </label>

                  <label className="text-sm font-medium">
                    PIN Code
                    <input
                      required
                      inputMode="numeric"
                      maxLength={6}
                      className={fieldClass}
                      value={pin}
                      onChange={(e) => {
                        setPin(
                          e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 6)
                        );
                        setVerifiedPin("");
                        setPinMessage("");
                      }}
                      placeholder="6-digit PIN"
                    />
                  </label>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="mt-4"
                  disabled={checkingPin || pin.length !== 6}
                  onClick={checkPin}
                >
                  {checkingPin
                    ? "Checking..."
                    : "Verify Delivery PIN"}
                </Button>

                {pinMessage && (
                  <p className="mt-3 text-sm">{pinMessage}</p>
                )}
              </section>

              <section className="rounded-2xl border bg-white p-6">
                <h2 className="text-xl font-bold">
                  3. Payment Method
                </h2>

                <div className="mt-5 rounded-xl border border-orange-400 bg-orange-50 p-4">
                  <p className="font-semibold">
                    ● Cash on Delivery
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Pay when your battery is delivered.
                  </p>
                </div>

                <div className="mt-3 rounded-xl border bg-slate-50 p-4 opacity-60">
                  <p className="font-semibold">
                    20% Advance Payment
                  </p>
                  <p className="text-sm">
                    Coming soon
                  </p>
                </div>

                <div className="mt-3 rounded-xl border bg-slate-50 p-4 opacity-60">
                  <p className="font-semibold">
                    UPI / Card Payment
                  </p>
                  <p className="text-sm">
                    Coming soon
                  </p>
                </div>
              </section>

              {hasStockIssue && (
                <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                  Some items are unavailable or exceed stock.
                  Please update your cart.
                </p>
              )}

              {error && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 p-4 text-sm text-red-700"
                >
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={!formValid || submitting}
                className="w-full bg-orange-600 py-6 text-lg font-bold hover:bg-orange-700"
              >
                {submitting
                  ? "Placing Order..."
                  : `Place Order — ${formatPrice(totalPaise)}`}
              </Button>

              <p className="text-center text-xs text-slate-500">
                No online payment is collected.
                Your order is confirmed only after
                the server accepts it.
              </p>
            </form>

            <aside className="h-fit rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">
                Order Summary
              </h2>

              <div className="mt-5 space-y-4">
                {cartRows.map(({ item, product, subtotal }) => (
                  <div
                    key={`${item.productId}-${item.exchange}`}
                    className="border-b pb-4"
                  >
                    <p className="font-semibold">
                      {product
                        ? `${product.brand} ${product.model}`
                        : "Product unavailable"}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Quantity: {item.quantity}
                    </p>

                    <p className="text-sm text-slate-500">
                      {item.exchange === "with"
                        ? "With Old Battery Exchange"
                        : "Without Old Battery Exchange"}
                    </p>

                    {product && (
                      <p className="mt-2 font-semibold">
                        {formatPrice(subtotal)}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-5 flex justify-between text-sm">
                <span>Delivery</span>
                <span className="text-green-700">FREE</span>
              </div>

              <div className="mt-3 flex justify-between text-sm">
                <span>Installation</span>
                <span className="text-green-700">FREE</span>
              </div>

              <div className="mt-5 flex justify-between border-t pt-5 text-xl font-bold">
                <span>Grand Total</span>
                <span>{formatPrice(totalPaise)}</span>
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Prices include GST.
              </p>

              <div className="mt-5 border-t pt-5">
                <div className="flex justify-between text-sm">
                  <span>Pay Now</span>
                  <span>{formatPrice(0)}</span>
                </div>

                <div className="mt-3 flex justify-between font-semibold">
                  <span>Pay on Delivery</span>
                  <span>{formatPrice(totalPaise)}</span>
                </div>
              </div>

              <p className="mt-5 text-xs text-slate-500">
                Exchange eligibility is verified on delivery.
                If the old battery is ineligible, the final
                amount due may increase.
              </p>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
