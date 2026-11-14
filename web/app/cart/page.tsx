"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, ArrowRight, ShoppingBag } from "lucide-react";
import { StorefrontNav } from "@/components/layout/storefront-nav";
import { CartItemCard } from "@/components/cart/cart-item";
import { CartSummary } from "@/components/cart/cart-summary";
import { glass } from "@/components/cart/styles";
import { getCart, removeFromCart, updateCartQuantity, type CartItem } from "@/lib/cart";
import type { Product } from "@/types/product";

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  // Restore cart and fetch current product prices/stock.
  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) setItems(getCart());
    });

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

              {rows.map((row) => (
                <CartItemCard
                  key={`${row.item.productId}-${row.item.exchange}`}
                  row={row}
                  totalItems={totalItems}
                  error={error}
                  onChangeQuantity={changeQuantity}
                  onRemove={removeItem}
                />
              ))}
            </div>

            {/* RIGHT: ORDER SUMMARY */}
            <CartSummary
              totalItems={totalItems}
              totalPaise={totalPaise}
              missingProduct={missingProduct}
              stockIssue={stockIssue}
              unsupportedCategory={unsupportedCategory}
              quantityLimit={quantityLimit}
              error={error}
              canCheckout={canCheckout}
            />
          </div>
        )}
      </div>
    </main>
  );
}
