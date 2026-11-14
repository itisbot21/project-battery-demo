"use client";

import Link from "next/link";
import { ArrowRight, Check, Truck, Wrench } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";
import { glass } from "./styles";

type Props = {
  totalItems: number;
  totalPaise: number;
  missingProduct: boolean;
  stockIssue: boolean;
  unsupportedCategory: boolean;
  quantityLimit: boolean;
  error: string;
  canCheckout: boolean;
};

export function CartSummary({ totalItems, totalPaise, missingProduct, stockIssue, unsupportedCategory, quantityLimit, error, canCheckout }: Props) {
  return (
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
              ? formatCurrency(totalPaise)
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
              ? formatCurrency(totalPaise)
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
  );
}
