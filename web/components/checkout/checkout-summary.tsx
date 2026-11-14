import { BatteryFull, PackageCheck, Truck, Wrench } from "lucide-react";
import type { CartItem } from "@/lib/cart";
import { formatCurrency } from "@/lib/format-currency";
import type { Product } from "@/types/product";
import { panel } from "./styles";

export type CheckoutRow = { item: CartItem; product: Product | undefined; unitPrice: number; subtotal: number };

type Props = { rows: CheckoutRow[]; totalItems: number; totalPaise: number; invalidCart: boolean };

export function CheckoutSummary({ rows, totalItems, totalPaise, invalidCart }: Props) {
  return (
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
                    ? formatCurrency(subtotal)
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
              : formatCurrency(totalPaise)}
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
            : formatCurrency(totalPaise)}
        </span>
      </div>

      {/* PAYMENT BREAKDOWN */}
      <div className="mt-4 rounded-xl bg-[#EAF5FB]/75 px-3 py-3 text-xs leading-5 text-[#587589]">
        <div className="flex justify-between">
          <span>Pay now</span>
          <strong>{formatCurrency(0)}</strong>
        </div>

        <div className="mt-1.5 flex justify-between">
          <span>Pay on delivery</span>
          <strong>
            {invalidCart
              ? "—"
              : formatCurrency(totalPaise)}
          </strong>
        </div>
      </div>

      <p className="mt-4 text-[11px] leading-5 text-[#718797]">
        Old battery exchange is checked at
        delivery. If the old battery isn&apos;t eligible,
        you&apos;ll pay the difference.
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
  );
}
