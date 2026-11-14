"use client";

import { useState } from "react";
import Link from "next/link";
import { StorefrontNav } from "@/components/layout/storefront-nav";
import { HeroSection } from "@/components/home/hero-section";
import { ProductSection } from "@/components/home/product-section";
import { useProducts } from "@/hooks/use-products";
import { addToCart } from "@/lib/cart";
import type { FinderSelection } from "@/components/battery-finder/battery-finder";
import type { Product } from "@/types/product";
import type { SelectedVehicle } from "@/types/vehicle";
import { ManufacturerSection } from "@/components/home/manufacturer-section";
import { BatteryBrandSection } from "@/components/home/battery-brand-section";

export default function Home() {
  const { products, loading, error } = useProducts();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("All");

  const [vehicle, setVehicle] =
    useState<SelectedVehicle | null>(null);

  const [finderKey, setFinderKey] = useState(0);
  const [cartMessage, setCartMessage] = useState("");

  const sellableProducts = products.filter(
    (product) =>
      product.category === "Car" ||
      product.category === "Bike"
  );

  const filteredProducts = sellableProducts.filter(
    (product) => {
      const matchesCategory =
        selected === "All" ||
        product.category === selected;

      const matchesBrand =
        `${product.brand} ${product.model}`
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesVehicle =
        !vehicle ||
        vehicle.type === product.category;

      return (
        matchesCategory &&
        matchesBrand &&
        matchesVehicle
      );
    }
  );

  function clearFilters() {
    setSearch("");
    setSelected("All");
    setVehicle(null);
    setFinderKey((key) => key + 1);
  }

  function addBattery(
    product: Product,
    exchange: "with" | "without"
  ) {
    addToCart(product.id, exchange);

    setCartMessage(
      `${product.brand} ${product.model} added to cart`
    );
  }
  function handleFinderSearch(selection: FinderSelection) {
    setSelected(selection.type);
    setSearch(selection.batteryBrand);
    setVehicle({
      type: selection.type,
      name: [selection.brand, selection.model, selection.variant]
        .filter(Boolean)
        .join(" "),
    });
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <main className="relative min-h-screen overflow-x-clip bg-[#F6FAFC] text-[#17364E]">

      {/* PAGE BACKGROUND */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[660px] overflow-hidden"
      >
        <div className="absolute -left-40 top-0 h-[420px] w-[420px] rounded-full bg-[#89CFF0]/25 blur-[110px]" />

        <div className="absolute -right-32 top-24 h-[350px] w-[350px] rounded-full bg-[#89CFF0]/10 blur-[110px]" />
      </div>

      <StorefrontNav />

      <HeroSection
        finderKey={finderKey}
        availableBrands={[...new Set(sellableProducts.map((product) => product.brand))].sort()}
        onSearch={handleFinderSearch}
      />

      <ManufacturerSection />

      <BatteryBrandSection
        onSelectBrand={(brand) => {
          setSearch(brand);
          setSelected("All");
          setVehicle(null);

          requestAnimationFrame(() => {
            document
              .getElementById("products")
              ?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
          });
        }}
      />

      <ProductSection
        vehicle={vehicle}
        loading={loading}
        error={error}
        filteredProducts={filteredProducts}
        clearFilters={clearFilters}
        onAdd={addBattery}
      />
      {/* CART CONFIRMATION */}
      {cartMessage && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[60] w-[calc(100%-32px)] max-w-sm -translate-x-1/2 rounded-[18px] border border-[#C5DFEB] bg-white/90 p-4 text-center shadow-xl backdrop-blur-xl"
        >
          <p className="text-sm font-semibold text-[#25475F]">
            {cartMessage}
          </p>

          <div className="mt-3 flex items-center justify-center gap-4">
            <Link
              href="/cart"
              className="text-sm font-bold text-[#287FAF] underline"
            >
              View cart
            </Link>

            <button
              type="button"
              onClick={() => setCartMessage("")}
              className="text-sm text-[#647D8F]"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-[#E1EDF3] bg-white/50 px-5 py-10 text-center backdrop-blur-xl">
        <h2 className="text-lg font-extrabold tracking-tight text-[#243F56]">
          PROJECT
          <span className="text-[#4C9FC9]">
            BATTERY
          </span>
        </h2>

        <p className="mt-2 text-xs text-[#6E8494]">
          Car &amp; bike batteries · Mumbai &amp;
          Navi Mumbai
        </p>

        <div className="mt-4 flex items-center justify-center gap-5 text-xs">
          <Link
            href="/about"
            className="font-semibold text-[#387DA4] hover:underline"
          >
            About Us
          </Link>

          <Link
            href="/#products"
            className="font-semibold text-[#387DA4] hover:underline"
          >
            Shop Batteries
          </Link>
        </div>
      </footer>
    </main>
  );
}
