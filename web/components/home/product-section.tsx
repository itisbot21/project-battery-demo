
"use client";

import { BatteryCharging, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/products/product-card";
import { glass } from "./styles";

import type { Product } from "@/types/product";
import type { SelectedVehicle } from "@/types/vehicle";

type Props = {
  vehicle: SelectedVehicle | null;
  loading: boolean;
  error: string;
  filteredProducts: Product[];
  clearFilters: () => void;

  // Temporary compatibility with app/page.tsx.
  // We'll remove this prop in the next file.
  onAdd?: (
    product: Product,
    exchange: "with" | "without"
  ) => void;
};

export function ProductSection({
  vehicle,
  loading,
  error,
  filteredProducts,
  clearFilters,
}: Props) {
  return (
    <section
      id="products"
      className="mx-auto max-w-[1160px] scroll-mt-32 px-5 pb-20 sm:px-8"
    >
      {/* HEADER */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
            Explore batteries
          </h2>

          <p className="mt-2 text-sm text-[#688092]">
            GST included. Free delivery and installation.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={clearFilters}
          className="rounded-xl border-[#C8DEEB] bg-white/75 text-[#36556C] hover:bg-[#E8F5FC]"
        >
          <RotateCcw size={15} className="mr-2" />
          Clear filters
        </Button>
      </div>

      {/* SELECTED VEHICLE */}
      {vehicle && (
        <div className="mt-5 rounded-[14px] border border-[#C7E4F1] bg-[#EAF6FC]/80 px-4 py-3">
          <p className="text-sm font-semibold text-[#244C68]">
            Browsing {vehicle.type} batteries for{" "}
            {vehicle.name}
          </p>

          <p className="mt-1 text-xs text-[#5F798B]">
            Exact vehicle compatibility has not yet
            been verified.
          </p>
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <p
          role="status"
          className="mt-8 text-sm text-[#688092]"
        >
          Loading batteries...
        </p>
      )}

      {/* ERROR */}
      {error && !loading && (
        <div className="mt-8 rounded-[18px] border border-red-200 bg-red-50 p-5">
          <p className="text-sm text-red-700">
            {error}
          </p>

          <Button
            variant="outline"
            className="mt-3"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      )}

      {/* PRODUCT GRID */}
      {!loading && !error && (
        <>
          <p className="mt-5 text-xs text-[#688092]">
            {filteredProducts.length} batteries found
          </p>

          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>

          {/* NO RESULTS */}
          {filteredProducts.length === 0 && (
            <div
              className={`mt-6 rounded-[18px] p-8 text-center ${glass}`}
            >
              <BatteryCharging
                size={36}
                className="mx-auto text-[#398DB9]"
                aria-hidden="true"
              />

              <h3 className="mt-3 text-lg font-bold">
                No batteries found
              </h3>

              <p className="mt-2 text-sm text-[#688092]">
                Try another category or brand.
              </p>

              <Button
                onClick={clearFilters}
                className="mt-4 rounded-xl bg-[#89CFF0] text-[#17364E] hover:bg-[#71C4EC]"
              >
                Show all batteries
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}