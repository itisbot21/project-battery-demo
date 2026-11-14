"use client";

import { BatteryFull, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { glass } from "@/components/home/styles";
import type { Product } from "@/types/product";

function formatPrice(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(paise / 100);
}

type Props = { product: Product; onAdd: (product: Product, exchange: "with" | "without") => void };

export function ProductCard({ product, onAdd }: Props) {
  return (
    <article
      className={`overflow-hidden rounded-[20px] p-4 ${glass}`}
    >
      {/* PRODUCT VISUAL */}
      <div className="relative flex h-36 items-center justify-center rounded-[14px] bg-[#EAF5FB]/80">
        <BatteryFull
          size={78}
          strokeWidth={1.2}
          className="text-[#3F98C6]"
          aria-hidden="true"
        />

        <span className="absolute left-3 top-3 rounded-lg bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-[#306B8F]">
          {product.brand}
        </span>

        <span
          className={`absolute right-3 top-3 rounded-lg px-2.5 py-1 text-[11px] font-bold ${product.stock > 0
            ? "bg-[#E4F8EB] text-[#267B4B]"
            : "bg-red-50 text-red-600"
            }`}
        >
          {product.stock > 0
            ? "In stock"
            : "Out of stock"}
        </span>
      </div>

      {/* PRODUCT DETAILS */}
      <div className="pt-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#438AAD]">
          {product.category} battery
        </p>

        <h3 className="mt-1 text-lg font-extrabold text-[#193B54]">
          {product.brand} {product.model}
        </h3>

        <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-[#597487]">
          {product.capacityAh !== null && (
            <span className="rounded-md bg-[#E9F5FB] px-2.5 py-1">
              {product.capacityAh} Ah
            </span>
          )}

          {product.warrantyMonths !== null && (
            <span className="rounded-md bg-[#E9F5FB] px-2.5 py-1">
              {product.warrantyMonths} months warranty
            </span>
          )}
        </div>

        {/* PRICING */}
        <div className="mt-4 border-t border-[#DCEBF2] pt-3">
          <p className="text-xs text-[#8297A6]">
            MRP{" "}
            <s>
              {formatPrice(
                product.mrpPaise
              )}
            </s>
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-white/80 p-3">
              <p className="text-[11px] text-[#647D8F]">
                Without exchange
              </p>

              <p className="mt-1 text-sm font-bold text-[#25475F]">
                {formatPrice(
                  product.withoutExchangePaise
                )}
              </p>
            </div>

            <div className="rounded-xl bg-[#E4F7EC] p-3">
              <p className="text-[11px] text-[#388259]">
                With exchange
              </p>

              <p className="mt-1 text-sm font-extrabold text-[#207548]">
                {formatPrice(
                  product.withExchangePaise
                )}
              </p>
            </div>
          </div>

          <p className="mt-2 text-xs text-[#478164]">
            Save{" "}
            {formatPrice(
              product.withoutExchangePaise -
              product.withExchangePaise
            )}{" "}
            with exchange
          </p>
        </div>

        {/* CART BUTTONS */}
        <div className="mt-4 space-y-2">
          <Button
            disabled={product.stock <= 0}
            onClick={() =>
              onAdd(product, "with")
            }
            className="h-10 w-full rounded-xl bg-[#50C878] font-bold text-[#123E29] hover:bg-[#43B96D]"
          >
            <ShoppingCart
              size={16}
              className="mr-2"
            />
            Add with exchange
          </Button>

          <Button
            disabled={product.stock <= 0}
            onClick={() =>
              onAdd(
                product,
                "without"
              )
            }
            variant="outline"
            className="h-10 w-full rounded-xl border-[#C6DDE9] bg-white/75 font-semibold text-[#24445C] hover:bg-[#E9F5FB]"
          >
            Add without exchange
          </Button>
        </div>

        <p className="mt-2 text-center text-[11px] text-[#7C91A0]">
          GST included · Exchange verified
          at delivery
        </p>
      </div>
    </article>
  );
}
