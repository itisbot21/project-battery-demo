"use client";

import { AlertCircle, BatteryFull, Minus, Plus, Recycle, Trash2 } from "lucide-react";
import type { CartItem } from "@/lib/cart";
import { formatCurrency } from "@/lib/format-currency";
import type { Product } from "@/types/product";
import { glass } from "./styles";

export type CartRow = {
  item: CartItem;
  product: Product | undefined;
  unitPrice: number;
  subtotal: number;
  requested: number;
};

type Props = {
  row: CartRow;
  totalItems: number;
  error: string;
  onChangeQuantity: (item: CartItem, quantity: number) => void;
  onRemove: (item: CartItem) => void;
};

export function CartItemCard({ row, totalItems, error, onChangeQuantity, onRemove }: Props) {
  const { item, product, unitPrice, subtotal, requested } = row;
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
              onClick={() => onRemove(item)}
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
              ? formatCurrency(unitPrice)
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
              onChangeQuantity(
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
              onChangeQuantity(
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
              ? formatCurrency(subtotal)
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
