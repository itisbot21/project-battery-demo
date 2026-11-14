
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BatteryFull,
  Check,
  Minus,
  Plus,
  Recycle,
  ShoppingBag,
  Trash2,
  Truck,
  Wrench,
} from "lucide-react";

import StorefrontNav from "@/components/storefront-nav";
import {
  getCart,
  removeFromCart,
  updateCartQuantity,
  type CartItem,
} from "@/lib/cart";

type Product = {
  id: number;
  brand: string;
  model: string;
  category: string;
  stock: number;
  withExchangePaise: number;
  withoutExchangePaise: number;
};

const glass =
  "rounded-[20px] border border-white/85 bg-white/60 shadow-[0_10px_32px_rgba(32,72,102,0.07),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-[#89CFF0]/10 backdrop-blur-[18px]";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

function formatPrice(paise: number) {
  return currency.format(paise / 100);
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  // Restore cart and fetch current product prices/stock.
  useEffect(() => {
    setItems(getCart());

    const controller = new AbortController();

    async function loadProducts() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/products", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Products could not be loaded");
        }

        const data: unknown = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Invalid product data");
        }

        if (!controller.signal.aborted) {
          setProducts(data as Product[]);
        }
      } catch {
        if (!controller.signal.aborted) {
          setError(
            "We couldn't verify battery prices and stock. Please try again."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => controller.abort();
  }, [retryCount]);

  const productById = useMemo(
    () =>
      new Map(products.map((product) => [product.id, product])),
    [products]
  );

  // Combine quantities across both exchange options for stock checks.
  const requestedByProduct = new Map<number, number>();

  for (const item of items) {
    requestedByProduct.set(
      item.productId,
      (requestedByProduct.get(item.productId) ?? 0) +
      item.quantity
    );
  }

  const rows = items.map((item) => {
    const product = productById.get(item.productId);

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
      requested:
        requestedByProduct.get(item.productId) ??
        item.quantity,
    };
  });

  const totalItems = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const totalPaise = rows.reduce(
    (sum, row) => sum + row.subtotal,
    0
  );

  const missingProduct = rows.some(
    (row) => !row.product
  );

  const unsupportedCategory = rows.some(
    (row) =>
      row.product &&
      !["Car", "Bike"].includes(row.product.category)
  );

  const stockIssue = rows.some(
    (row) =>
      !row.product ||
      row.requested > row.product.stock
  );

  const quantityLimit =
    items.length > 20 ||
    totalItems > 30 ||
    items.some((item) => item.quantity > 10);

  const canCheckout =
    !loading &&
    !error &&
    rows.length > 0 &&
    !stockIssue &&
    !unsupportedCategory &&
    !quantityLimit &&
    totalPaise > 0;

  function changeQuantity(
    item: CartItem,
    nextQuantity: number
  ) {
    setItems(
      updateCartQuantity(
        item.productId,
        item.exchange,
        nextQuantity
      )
    );
  }

  function removeItem(item: CartItem) {
    setItems(
      removeFromCart(item.productId, item.exchange)
    );
  }

  return (
    <main className="relative min-h-screen overflow-x-clip bg-[#F6FAFC] text-[#17364E]">

      {/* SUBTLE PAGE BACKGROUND */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] overflow-hidden">
        <div className="absolute -left-40 top-0 h-[400px] w-[400px] rounded-full bg-[#89CFF0]/25 blur-[110px]" />
        <div className="absolute -right-32 top-16 h-[340px] w-[340px] rounded-full bg-[#89CFF0]/10 blur-[110px]" />
      </div>

      {/* SAME NAVBAR AS HOMEPAGE */}
      <StorefrontNav />

      <div className="relative z-10 mx-auto max-w-[1160px] px-5 pb-20 pt-10 sm:px-8 sm:pt-14">

        {/* PAGE HEADING */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#398DB9]">
              Your selection
            </p>

            <h1 className="mt-2 font-heading text-[clamp(2rem,3vw,2.75rem)] font-extrabold tracking-[-0.04em]">
              Shopping cart
            </h1>

            <p className="mt-1 text-sm text-[#678093]">
              {loading
                ? "Checking your cart..."
                : `${totalItems} ${totalItems === 1
                  ? "battery"
                  : "batteries"
                } in your cart`}
            </p>
          </div>

          <Link
            href="/#products"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#D0E2EC] bg-white/70 px-4 text-[13px] font-semibold text-[#315A73] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-[#398DB9]"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Continue shopping
          </Link>
        </div>

        {/* LOADING */}
        {loading ? (
          <div
            className={`${glass} mt-8 p-8 text-sm text-[#678093]`}
            role="status"
          >
            Loading product prices and availability...
          </div>
        ) : items.length === 0 ? (

          /* EMPTY CART */
          <div
            className={`${glass} mx-auto mt-8 max-w-[650px] px-6 py-12 text-center sm:py-16`}
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[18px] border border-white/90 bg-[#E4F4FC] text-[#398DB9]">
              <ShoppingBag
                size={29}
                strokeWidth={1.6}
                aria-hidden="true"
              />
            </div>

            <h2 className="mt-5 text-xl font-extrabold tracking-tight">
              Your cart is empty
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#678093]">
              Find a car or bike battery that fits your needs
              and add it to your cart.
            </p>

            <Link
              href="/#products"
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#89CFF0] px-5 text-sm font-bold text-[#17364E] transition-colors hover:bg-[#74C4E9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#398DB9]"
            >
              Browse batteries
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        ) : (

          /* CART CONTENT */
          <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-7">

            {/* LEFT: CART ITEMS */}
            <div className="space-y-4">

              {error && (
                <div
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-red-200 bg-red-50/90 p-4 text-sm text-red-700"
                  role="alert"
                >
                  <span className="flex items-center gap-2">
                    <AlertCircle size={18} aria-hidden="true" />
                    {error}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setRetryCount((count) => count + 1)
                    }
                    className="rounded-lg bg-white px-3 py-2 font-semibold text-red-700 hover:bg-red-100"
                  >
                    Retry
                  </button>
                </div>
              )}

              {rows.map(
                ({
                  item,
                  product,
                  unitPrice,
                  subtotal,
                  requested,
                }) => {
                  const maxReached =
                    !product ||
                    !["Car", "Bike"].includes(
                      product.category
                    ) ||
                    requested >= product.stock ||
                    item.quantity >= 10 ||
                    totalItems >= 30;

                  const overStock = product
                    ? requested > product.stock
                    : false;

                  return (
                    <article
                      key={`${item.productId}-${item.exchange}`}
                      className={`${glass} p-4 sm:p-5`}
                    >
                      {/* PRODUCT INFORMATION */}
                      <div className="flex gap-3 sm:gap-5">

                        {/* BATTERY PLACEHOLDER */}
                        <div className="flex h-[84px] w-[84px] shrink-0 items-center justify-center rounded-[15px] border border-white/80 bg-[#E7F5FC]/80 text-[#398DB9] sm:h-[100px] sm:w-[100px]">
                          <BatteryFull
                            size={48}
                            strokeWidth={1.4}
                            aria-hidden="true"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">

                            <div className="min-w-0">
                              <h2 className="text-[15px] font-extrabold leading-6 text-[#193B54] sm:text-[17px]">
                                {product
                                  ? `${product.brand} ${product.model}`
                                  : `Battery #${item.productId}`}
                              </h2>

                              {/* EXCHANGE BADGE */}
                              <span
                                className={`mt-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold ${item.exchange === "with"
                                    ? "bg-[#E5F7ED] text-[#278052]"
                                    : "bg-[#E9F2F8] text-[#4E6A7F]"
                                  }`}
                              >
                                {item.exchange === "with" && (
                                  <Recycle
                                    size={13}
                                    aria-hidden="true"
                                  />
                                )}

                                {item.exchange === "with"
                                  ? "With old battery exchange"
                                  : "Without exchange"}
                              </span>
                            </div>

                            {/* REMOVE */}
                            <button
                              type="button"
                              onClick={() => removeItem(item)}
                              aria-label={`Remove ${product
                                  ? `${product.brand} ${product.model}`
                                  : "battery"
                                } from cart`}
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#8095A4] transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-red-400"
                            >
                              <Trash2
                                size={17}
                                aria-hidden="true"
                              />
                            </button>
                          </div>

                          <p className="mt-3 text-[15px] font-bold text-[#17364E]">
                            {product && !error
                              ? formatPrice(unitPrice)
                              : "Price unavailable"}

                            {product && !error && (
                              <span className="ml-1 text-[11px] font-normal text-[#8095A4]">
                                / battery
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* QUANTITY AND SUBTOTAL */}
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#DAE8F0] pt-4">

                        <div className="inline-flex h-10 items-center rounded-xl border border-[#D5E5ED] bg-white/70 p-1">

                          <button
                            type="button"
                            onClick={() =>
                              changeQuantity(
                                item,
                                item.quantity - 1
                              )
                            }
                            aria-label="Decrease quantity"
                            className="flex h-8 w-9 items-center justify-center rounded-lg text-[#36566F] hover:bg-[#EAF5FB] focus-visible:outline-2 focus-visible:outline-[#398DB9]"
                          >
                            <Minus
                              size={16}
                              aria-hidden="true"
                            />
                          </button>

                          <span className="min-w-8 text-center text-sm font-bold tabular-nums">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            disabled={maxReached}
                            onClick={() =>
                              changeQuantity(
                                item,
                                item.quantity + 1
                              )
                            }
                            aria-label="Increase quantity"
                            className="flex h-8 w-9 items-center justify-center rounded-lg text-[#36566F] hover:bg-[#EAF5FB] focus-visible:outline-2 focus-visible:outline-[#398DB9] disabled:cursor-not-allowed disabled:opacity-35"
                          >
                            <Plus
                              size={16}
                              aria-hidden="true"
                            />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-[11px] text-[#8095A4]">
                            Subtotal
                          </p>

                          <p className="text-[16px] font-extrabold tabular-nums text-[#17364E]">
                            {product && !error
                              ? formatPrice(subtotal)
                              : "—"}
                          </p>
                        </div>
                      </div>

                      {/* PRODUCT WARNINGS */}
                      {!product && !error && (
                        <p
                          className="mt-3 flex items-center gap-2 text-xs text-red-600"
                          role="alert"
                        >
                          <AlertCircle size={15} />
                          This product is no longer available.
                          Remove it to continue.
                        </p>
                      )}

                      {product &&
                        !["Car", "Bike"].includes(
                          product.category
                        ) && (
                          <p
                            className="mt-3 flex items-center gap-2 text-xs text-red-600"
                            role="alert"
                          >
                            <AlertCircle size={15} />
                            This battery category is no longer
                            sold. Remove it to continue.
                          </p>
                        )}

                      {overStock && (
                        <p
                          className="mt-3 flex items-center gap-2 text-xs text-red-600"
                          role="alert"
                        >
                          <AlertCircle size={15} />
                          Only {product?.stock} in stock across
                          both exchange options. Reduce the
                          quantity.
                        </p>
                      )}
                    </article>
                  );
                }
              )}
            </div>

            {/* RIGHT: ORDER SUMMARY */}
            <aside
              className={`${glass} p-5 sm:p-6 lg:sticky lg:top-32`}
            >
              <h2 className="text-lg font-extrabold tracking-tight">
                Order summary
              </h2>

              <p className="mt-1 text-xs text-[#7890A1]">
                Prices include GST
              </p>

              <div className="mt-6 space-y-3 text-[13px]">

                <div className="flex justify-between gap-4 text-[#607B8E]">
                  <span>Items ({totalItems})</span>
                  <span className="font-semibold text-[#294B63]">
                    {!error && !missingProduct
                      ? formatPrice(totalPaise)
                      : "—"}
                  </span>
                </div>

                <div className="flex justify-between gap-4 text-[#607B8E]">
                  <span className="flex items-center gap-2">
                    <Truck size={15} aria-hidden="true" />
                    Delivery
                  </span>

                  <span className="font-semibold text-[#27965B]">
                    FREE
                  </span>
                </div>

                <div className="flex justify-between gap-4 text-[#607B8E]">
                  <span className="flex items-center gap-2">
                    <Wrench size={15} aria-hidden="true" />
                    Installation
                  </span>

                  <span className="font-semibold text-[#27965B]">
                    FREE
                  </span>
                </div>
              </div>

              {/* TOTAL */}
              <div className="mt-5 border-t border-[#DBE8EF] pt-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold">
                    Total
                  </span>

                  <strong className="text-[22px] font-extrabold tracking-tight tabular-nums">
                    {!error && !missingProduct
                      ? formatPrice(totalPaise)
                      : "—"}
                  </strong>
                </div>
              </div>

              {/* VALIDATION MESSAGE */}
              {(stockIssue ||
                unsupportedCategory ||
                quantityLimit ||
                error) && (
                  <p
                    className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700"
                    role="alert"
                  >
                    {error
                      ? "We must verify prices and stock before checkout."
                      : quantityLimit
                        ? "Cart limit reached: maximum 10 per line and 30 batteries per order."
                        : unsupportedCategory
                          ? "Your cart contains a battery category we no longer sell. Please remove it."
                          : "Some batteries are unavailable or exceed available stock. Please adjust your cart."}
                  </p>
                )}

              {/* CHECKOUT BUTTON */}
              {canCheckout ? (
                <Link
                  href="/checkout"
                  className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#50C878] text-sm font-bold text-[#123E29] shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_4px_12px_rgba(47,151,92,0.14)] transition-colors hover:bg-[#43BA6D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#268F54]"
                >
                  Proceed to checkout
                  <ArrowRight
                    size={17}
                    aria-hidden="true"
                  />
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="mt-5 flex h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-[#50C878]/45 text-sm font-bold text-[#517865]"
                >
                  Proceed to checkout
                  <ArrowRight
                    size={17}
                    aria-hidden="true"
                  />
                </button>
              )}

              {/* EXCHANGE DISCLAIMER */}
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#EAF5FB]/75 p-3 text-[11px] leading-[18px] text-[#607B8E]">
                <Check
                  size={15}
                  className="mt-0.5 shrink-0 text-[#2E9362]"
                  aria-hidden="true"
                />

                <p>
                  Exchange prices are subject to old-battery
                  verification at delivery. If ineligible, the
                  price difference is payable.
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}