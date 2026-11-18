"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BatteryFull } from "lucide-react";
import { StorefrontNav } from "@/components/layout/storefront-nav";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { CheckoutSummary } from "@/components/checkout/checkout-summary";
import { OrderConfirmation, type ConfirmedOrder } from "@/components/checkout/order-confirmation";
import { panel } from "@/components/checkout/styles";
import { getCart, type CartItem } from "@/lib/cart";
import type { Product } from "@/types/product";

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);
  const [loadError, setLoadError] = useState("");
  // LOAD CART AND CURRENT PRODUCT DATA
  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) setCart(getCart());
    });

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
          <OrderConfirmation confirmedOrder={confirmedOrder} />
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
                <CheckoutForm
                  cart={cart}
                  totalPaise={totalPaise}
                  invalidCart={invalidCart}
                  loading={loading}
                  loadError={loadError}
                  confirmedOrder={confirmedOrder}
                  onReload={() => setReloadKey((key) => key + 1)}
                  onConfirmed={(order) => { setConfirmedOrder(order); setCart([]); }}
                />
                <CheckoutSummary rows={rows} totalItems={totalItems} totalPaise={totalPaise} invalidCart={invalidCart} />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}