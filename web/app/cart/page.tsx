
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
  stock: number;
  withExchangePaise: number;
  withoutExchangePaise: number;
};

function formatPrice(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(paise / 100);
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setItems(getCart());

    const controller = new AbortController();

    async function loadProducts() {
      try {
        const response = await fetch("/api/products", {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load products");
        }

        const data: unknown = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Invalid product response");
        }

        if (!controller.signal.aborted) {
          setProducts(data as Product[]);
        }
      } catch {
        if (!controller.signal.aborted) {
          setError("Could not load product details.");
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

  function changeQuantity(
    productId: number,
    exchange: "with" | "without",
    quantity: number
  ) {
    setItems(
      updateCartQuantity(productId, exchange, quantity)
    );
  }

  function removeItem(
    productId: number,
    exchange: "with" | "without"
  ) {
    setItems(removeFromCart(productId, exchange));
  }

  const cartDetails = items.map((item) => {
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
      price,
      subtotal: price * item.quantity,
    };
  });

  const hasStockIssue = cartDetails.some(
    ({ item, product }) => {
      if (!product || product.stock <= 0) return true;

      const totalQuantity = items
        .filter((i) => i.productId === item.productId)
        .reduce((sum, i) => sum + i.quantity, 0);

      return totalQuantity > product.stock;
    }
  );

  const totalPaise = cartDetails.reduce(
    (total, row) => total + row.subtotal,
    0
  );

  const totalItems = items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-xl font-extrabold">
            PROJECT
            <span className="text-orange-600">BATTERY</span>
          </Link>

          <Link
            href="/"
            className="text-sm font-medium text-orange-600"
          >
            Continue Shopping
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-bold">
          🛒 Shopping Cart
        </h1>

        <p className="mt-2 text-slate-500">
          {totalItems} items in your cart
        </p>

        {loading && (
          <p className="mt-8">Loading your cart...</p>
        )}

        {error && !loading && (
          <p className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">
            {error} Refresh the page to try again.
          </p>
        )}

        {!loading && items.length === 0 && (
          <div className="mt-8 rounded-2xl border bg-white p-10 text-center">
            <p className="text-xl font-semibold">
              Your cart is empty
            </p>

            <p className="mt-2 text-slate-500">
              Add some batteries to get started.
            </p>

            <Link href="/">
              <Button className="mt-6 bg-orange-600 hover:bg-orange-700">
                Shop Batteries
              </Button>
            </Link>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              {cartDetails.map(
                ({ item, product, price, subtotal }) => {
                  const totalProductQuantity = items
                    .filter(
                      (i) => i.productId === item.productId
                    )
                    .reduce(
                      (sum, i) => sum + i.quantity,
                      0
                    );

                  return (
                    <div
                      key={`${item.productId}-${item.exchange}`}
                      className="rounded-2xl border bg-white p-6 shadow-sm"
                    >
                      <div className="flex gap-4">
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-4xl">
                          🔋
                        </div>

                        <div className="flex-1">
                          <h2 className="text-lg font-bold">
                            {product
                              ? `${product.brand} ${product.model}`
                              : `Product #${item.productId}`}
                          </h2>

                          <p className="mt-1 text-sm text-slate-500">
                            {item.exchange === "with"
                              ? "♻️ With Old Battery Exchange"
                              : "Without Old Battery Exchange"}
                          </p>

                          {product && (
                            <p className="mt-2 text-lg font-semibold text-green-700">
                              {formatPrice(price)}
                            </p>
                          )}

                          {!product && !error && (
                            <p className="mt-2 text-sm text-red-600">
                              Product unavailable
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t pt-4">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              changeQuantity(
                                item.productId,
                                item.exchange,
                                item.quantity - 1
                              )
                            }
                          >
                            −
                          </Button>

                          <span className="font-semibold">
                            {item.quantity}
                          </span>

                          <Button
                            variant="outline"
                            size="sm"
                            disabled={
                              !product ||
                              totalProductQuantity >= product.stock
                            }
                            onClick={() =>
                              changeQuantity(
                                item.productId,
                                item.exchange,
                                item.quantity + 1
                              )
                            }
                          >
                            +
                          </Button>
                        </div>

                        <Button
                          variant="outline"
                          className="text-red-600"
                          onClick={() =>
                            removeItem(
                              item.productId,
                              item.exchange
                            )
                          }
                        >
                          Remove
                        </Button>
                      </div>

                      {product && (
                        <p className="mt-4 text-right font-semibold">
                          Subtotal: {formatPrice(subtotal)}
                        </p>
                      )}

                      {product &&
                        totalProductQuantity > product.stock && (
                          <p className="mt-2 text-sm text-red-600">
                            Requested quantity exceeds available
                            stock ({product.stock}).
                          </p>
                        )}
                    </div>
                  );
                }
              )}
            </div>

            <aside className="h-fit rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">
                Order Summary
              </h2>

              <div className="mt-6 flex justify-between">
                <span>Items</span>
                <span>{totalItems}</span>
              </div>

              <div className="mt-4 flex justify-between">
                <span>Delivery</span>
                <span className="font-medium text-green-700">
                  FREE
                </span>
              </div>

              <div className="mt-4 flex justify-between">
                <span>Installation</span>
                <span className="font-medium text-green-700">
                  FREE
                </span>
              </div>

              <div className="mt-6 border-t pt-5">
                <div className="flex justify-between text-xl font-bold">
                  <span>Grand Total</span>
                  <span>{formatPrice(totalPaise)}</span>
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-500">
                Prices include GST. Exchange eligibility
                is verified at delivery.
              </p>

              {hasStockIssue && !error && (
                <p className="mt-4 text-sm text-red-600">
                  Some items are unavailable or exceed stock.
                  Please adjust your cart.
                </p>
              )}

              {error && (
                <p className="mt-4 text-sm text-red-600">
                  Total cannot be verified until products load.
                </p>
              )}

              <Button
                disabled
                className="mt-6 w-full bg-orange-600"
              >
                Checkout Coming Next
              </Button>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
