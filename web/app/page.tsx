
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BatteryCharging,
  BatteryFull,
  CarFront,
  Bike,
  Truck,
  ShieldCheck,
  PackageCheck,
  Wrench,
  Recycle,
  Search,
  ShoppingCart,
  RotateCcw,
  Zap,
  MapPin,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BatteryFinder from "@/components/battery-finder";
import PincodeChecker from "@/components/pincode-checker";
import StorefrontNav from "@/components/storefront-nav";
import { addToCart } from "@/lib/cart";

type Product = {
  id: number;
  slug: string;
  brand: string;
  model: string;
  category: string;
  capacityAh: number | null;
  warrantyMonths: number | null;
  mrpPaise: number;
  withoutExchangePaise: number;
  withExchangePaise: number;
  stock: number;
  active: boolean;
};

type SelectedVehicle = {
  type: "Car" | "Bike";
  name: string;
};

const categories = [
  { name: "Car", icon: CarFront },
  { name: "Bike", icon: Bike },
  { name: "Inverter", icon: BatteryCharging },
  { name: "Truck", icon: Truck },
];

function formatPrice(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(paise / 100);
}

const glass =
  "border border-white/90 bg-white/75 shadow-[0_12px_45px_rgba(234,88,12,0.07)] backdrop-blur-2xl";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("All");
  const [vehicle, setVehicle] =
    useState<SelectedVehicle | null>(null);

  const [finderKey, setFinderKey] = useState(0);
  const [cartMessage, setCartMessage] = useState("");

  useEffect(() => {
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
          throw new Error("Invalid response");
        }

        if (!controller.signal.aborted) {
          setProducts(data as Product[]);
          setError("");
        }
      } catch {
        if (!controller.signal.aborted) {
          setError(
            "Unable to load batteries. Please try again."
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
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selected === "All" || product.category === selected;

    const matchesSearch =
      `${product.brand} ${product.model} ${product.category}`
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesVehicle =
      !vehicle || product.category === vehicle.type;

    return (
      matchesCategory &&
      matchesSearch &&
      matchesVehicle
    );
  });

  function clearFilters() {
    setSearch("");
    setSelected("All");
    setVehicle(null);
    setFinderKey((key) => key + 1);
  }

  function selectCategory(category: string) {
    setSelected(category);
    setVehicle(null);
    setFinderKey((key) => key + 1);

    document.getElementById("products")?.scrollIntoView({
      behavior: "smooth",
    });
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

  return (
    <main className="min-h-screen bg-[#FFF9F3] text-[#20202A]">

      {/* FLOATING BOTTOM NAV */}
      <StorefrontNav />

      {/* BACKGROUND */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[700px] overflow-hidden">
        <div className="absolute -left-40 top-0 h-[400px] w-[400px] rounded-full bg-orange-200/50 blur-[110px]" />

        <div className="absolute -right-32 top-28 h-[450px] w-[450px] rounded-full bg-orange-300/35 blur-[120px]" />
      </div>

      {/* TOP BRAND BAR */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-7 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/20">
            <Zap size={25} fill="currentColor" />
          </div>

          <span className="font-heading text-lg font-extrabold tracking-tight sm:text-xl">
            PROJECT<span className="text-orange-600">BATTERY</span>
          </span>
        </Link>

        <div className="hidden items-center gap-2 rounded-full border border-white bg-white/75 px-5 py-3 text-sm font-medium text-slate-600 shadow-sm backdrop-blur-xl sm:flex">
          <MapPin size={16} className="text-orange-600" />
          Mumbai & Navi Mumbai
        </div>

        <Link
          href="/cart"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white bg-white/80 text-slate-800 shadow-sm backdrop-blur-xl transition hover:bg-orange-50 sm:hidden"
          aria-label="Shopping cart"
        >
          <ShoppingCart size={21} />
        </Link>
      </header>

      {/* HERO */}
      <section className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-5 pb-20 pt-12 sm:px-8 lg:grid-cols-2 lg:py-24">

        {/* LEFT */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-wider text-orange-600 backdrop-blur-xl">
            <Zap size={15} fill="currentColor" />
            Power delivered to your doorstep
          </div>

          <h1 className="mt-7 font-heading text-5xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
            Stay charged.
            <span className="mt-1 block text-orange-500">
              Keep moving.
            </span>
          </h1>

          <p className="mt-7 max-w-lg text-base leading-relaxed text-slate-600 sm:text-lg">
            Find the right battery for your car, bike,
            inverter or truck. Enjoy free doorstep delivery,
            installation and old battery exchange.
          </p>

          {/* GLASS SEARCH */}
          <div className={`mt-9 flex max-w-xl items-center gap-3 rounded-[24px] p-3 ${glass}`}>
            <Search
              size={23}
              className="ml-3 shrink-0 text-orange-500"
            />

            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search batteries..."
              aria-label="Search batteries"
              className="h-12 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
            />

            <a
              href="#products"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white transition hover:bg-orange-600"
              aria-label="View search results"
            >
              <ArrowRight size={22} />
            </a>
          </div>

          {/* HERO BUTTONS */}
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="#battery-finder"
              className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-7 py-4 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-1 hover:bg-orange-600"
            >
              Find My Battery
              <ArrowRight size={18} />
            </a>

            <a
              href="#products"
              className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/75 px-7 py-4 text-sm font-bold text-slate-800 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white"
            >
              Explore Products
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <span className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-orange-500" />
              Trusted battery brands
            </span>

            <span className="flex items-center gap-2">
              <PackageCheck size={18} className="text-orange-500" />
              Free installation
            </span>
          </div>
        </div>

        {/* RIGHT - FLOATING GLASS VISUAL */}
        <div className="relative mx-auto flex min-h-[370px] w-full max-w-[520px] items-center justify-center sm:min-h-[480px]">
          <div className="absolute h-[300px] w-[300px] rounded-full bg-orange-300/40 blur-[85px] sm:h-[400px] sm:w-[400px]" />

          <div className={`relative flex h-[310px] w-[310px] flex-col items-center justify-center rounded-[55px] p-8 text-center sm:h-[390px] sm:w-[390px] ${glass}`}>
            <div className="flex h-36 w-36 items-center justify-center rounded-[42px] border border-orange-200 bg-gradient-to-br from-orange-100 to-white shadow-inner sm:h-44 sm:w-44">
              <BatteryFull
                size={105}
                strokeWidth={1.2}
                className="text-orange-500"
              />
            </div>

            <h2 className="mt-7 font-heading text-2xl font-extrabold">
              Power for every journey
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Batteries delivered. Hassle removed.
            </p>
          </div>

          <div className="absolute -left-1 top-12 flex items-center gap-2 rounded-2xl border border-white bg-white/85 px-4 py-3 text-sm font-semibold shadow-xl shadow-orange-500/10 backdrop-blur-2xl sm:-left-5">
            <span className="rounded-xl bg-orange-100 p-2 text-orange-500">
              <Wrench size={19} />
            </span>
            Free Installation
          </div>

          <div className="absolute -right-1 bottom-9 flex items-center gap-2 rounded-2xl border border-white bg-white/85 px-4 py-3 text-sm font-semibold shadow-xl shadow-orange-500/10 backdrop-blur-2xl sm:-right-5">
            <span className="rounded-xl bg-orange-100 p-2 text-orange-500">
              <Recycle size={19} />
            </span>
            Battery Exchange
          </div>
        </div>
      </section>

      {/* SERVICES STRIP */}
      <section
        id="services"
        className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8"
      >
        <div className={`grid gap-4 rounded-[32px] p-6 md:grid-cols-3 md:gap-6 ${glass}`}>
          {[
            {
              title: "Free Delivery",
              description: "At your doorstep",
              icon: PackageCheck,
            },
            {
              title: "Free Installation",
              description: "No extra service charge",
              icon: Wrench,
            },
            {
              title: "Old Battery Exchange",
              description: "Save on your new battery",
              icon: Recycle,
            },
          ].map((service) => {
            const Icon = service.icon;

            return (
              <div
                key={service.title}
                className="flex items-center gap-4 rounded-2xl bg-orange-50/60 p-4"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-orange-500 shadow-sm">
                  <Icon size={27} />
                </div>

                <div>
                  <h3 className="font-bold">{service.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {service.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* DELIVERY PIN CHECKER */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className={`overflow-hidden rounded-[32px] p-4 sm:p-6 ${glass}`}>
          <PincodeChecker />
        </div>
      </section>

      {/* BATTERY FINDER */}
      <section
        id="battery-finder"
        className="mx-auto max-w-7xl scroll-mt-12 px-5 pb-20 sm:px-8"
      >
        <div className="mb-7">
          <p className="text-sm font-bold uppercase tracking-widest text-orange-500">
            Find your fit
          </p>

          <h2 className="mt-3 font-heading text-3xl font-extrabold sm:text-4xl">
            Find the right battery.
          </h2>

          <p className="mt-3 text-slate-500">
            Choose your vehicle to narrow down your options.
          </p>
        </div>

        <div className={`overflow-hidden rounded-[32px] p-3 sm:p-6 ${glass}`}>
          <BatteryFinder
            key={finderKey}
            onSearch={(selectedVehicle) => {
              setSearch("");
              setSelected("All");

              setVehicle({
                type: selectedVehicle.type,
                name: `${selectedVehicle.brand} ${selectedVehicle.model} ${selectedVehicle.variant}`,
              });

              document.getElementById("products")?.scrollIntoView({
                behavior: "smooth",
              });
            }}
          />
        </div>
      </section>

      {/* CATEGORIES */}
      <section
        id="categories"
        className="mx-auto max-w-7xl scroll-mt-12 px-5 pb-20 sm:px-8"
      >
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-orange-500">
              Explore categories
            </p>

            <h2 className="mt-3 font-heading text-3xl font-extrabold sm:text-4xl">
              Shop by Category
            </h2>
          </div>

          <p className="text-sm text-slate-500">
            Pick what you're powering.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {categories.map((category) => {
            const Icon = category.icon;
            const active = selected === category.name;

            return (
              <button
                type="button"
                key={category.name}
                onClick={() => selectCategory(category.name)}
                className={`group rounded-[28px] p-6 text-left transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${
                  active
                    ? "border border-orange-300 bg-orange-100/90 shadow-lg"
                    : glass
                }`}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-orange-50 text-orange-500 transition group-hover:bg-orange-500 group-hover:text-white">
                  <Icon size={34} strokeWidth={1.6} />
                </div>

                <h3 className="mt-7 font-heading text-xl font-bold">
                  {category.name}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Batteries
                </p>

                <div className="mt-5 flex justify-end text-orange-500">
                  <ArrowRight size={22} />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* PRODUCT SECTION */}
      <section
        id="products"
        className="mx-auto max-w-7xl scroll-mt-12 px-5 pb-24 sm:px-8"
      >
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-orange-500">
              Explore our collection
            </p>

            <h2 className="mt-3 font-heading text-3xl font-extrabold sm:text-4xl">
              Discover Batteries
            </h2>

            <p className="mt-3 text-sm text-slate-500">
              Prices include GST. Free delivery and installation.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={clearFilters}
            className="rounded-full border-orange-200 bg-white/80 px-5"
          >
            <RotateCcw size={16} className="mr-2" />
            Clear Filters
          </Button>
        </div>

        {vehicle && (
          <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-5">
            <p className="font-semibold text-orange-900">
              Selected: {vehicle.name}
            </p>

            <p className="mt-1 text-sm text-orange-700">
              Showing {vehicle.type} batteries.
              Exact vehicle compatibility is not yet verified.
            </p>
          </div>
        )}

        {loading && (
          <p className="mt-10 text-center text-slate-500">
            Loading batteries...
          </p>
        )}

        {error && !loading && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="text-red-700">{error}</p>

            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        )}

        {!loading && !error && (
          <>
            <p className="mt-6 text-sm text-slate-500">
              {filteredProducts.length} batteries found
            </p>

            <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => (
                <article
                  key={product.id}
                  className={`group overflow-hidden rounded-[30px] p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${glass}`}
                >
                  {/* PRODUCT VISUAL */}
                  <div className="relative flex h-48 items-center justify-center rounded-[24px] bg-gradient-to-br from-orange-50 to-white">
                    <BatteryFull
                      size={95}
                      strokeWidth={1.2}
                      className="text-orange-400 transition-transform duration-300 group-hover:scale-110"
                    />

                    <span className="absolute left-4 top-4 rounded-full border border-white bg-white/85 px-3 py-1.5 text-xs font-bold text-orange-600 shadow-sm backdrop-blur-lg">
                      {product.brand}
                    </span>

                    <span
                      className={`absolute right-4 top-4 rounded-full px-3 py-1.5 text-xs font-bold ${
                        product.stock > 0
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {product.stock > 0
                        ? "In Stock"
                        : "Out of Stock"}
                    </span>
                  </div>

                  {/* PRODUCT INFO */}
                  <div className="pt-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-orange-500">
                      {product.category} Battery
                    </p>

                    <h3 className="mt-2 font-heading text-xl font-extrabold">
                      {product.brand} {product.model}
                    </h3>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {product.capacityAh !== null && (
                        <span className="rounded-full bg-orange-50 px-3 py-1 text-xs text-slate-600">
                          {product.capacityAh} Ah
                        </span>
                      )}

                      {product.warrantyMonths !== null && (
                        <span className="rounded-full bg-orange-50 px-3 py-1 text-xs text-slate-600">
                          {product.warrantyMonths} Months Warranty
                        </span>
                      )}
                    </div>

                    {/* PRICING */}
                    <div className="mt-6 border-t border-orange-100 pt-5">
                      <p className="text-sm text-slate-400">
                        MRP{" "}
                        <s>{formatPrice(product.mrpPaise)}</s>
                      </p>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-white/85 p-3">
                          <p className="text-xs text-slate-500">
                            Without Exchange
                          </p>

                          <p className="mt-2 text-base font-bold">
                            {formatPrice(
                              product.withoutExchangePaise
                            )}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-orange-50 p-3">
                          <p className="text-xs text-orange-700">
                            With Exchange
                          </p>

                          <p className="mt-2 text-base font-extrabold text-orange-600">
                            {formatPrice(
                              product.withExchangePaise
                            )}
                          </p>
                        </div>
                      </div>

                      <p className="mt-3 text-xs font-semibold text-orange-600">
                        Save{" "}
                        {formatPrice(
                          product.withoutExchangePaise -
                          product.withExchangePaise
                        )}{" "}
                        with old battery exchange
                      </p>
                    </div>

                    {/* CART ACTIONS */}
                    <div className="mt-6 space-y-2">
                      <Button
                        disabled={product.stock <= 0}
                        onClick={() =>
                          addBattery(product, "with")
                        }
                        className="h-12 w-full rounded-2xl bg-orange-500 font-bold text-white hover:bg-orange-600"
                      >
                        <ShoppingCart size={17} className="mr-2" />
                        Add With Exchange
                      </Button>

                      <Button
                        disabled={product.stock <= 0}
                        onClick={() =>
                          addBattery(product, "without")
                        }
                        variant="outline"
                        className="h-12 w-full rounded-2xl border-orange-200 bg-white/80 font-semibold hover:bg-orange-50"
                      >
                        Add Without Exchange
                      </Button>
                    </div>

                    <p className="mt-3 text-center text-xs text-slate-400">
                      GST included · Exchange verified at delivery
                    </p>
                  </div>
                </article>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className={`mt-8 rounded-[28px] p-10 text-center ${glass}`}>
                <BatteryCharging
                  size={42}
                  className="mx-auto text-orange-400"
                />

                <h3 className="mt-4 font-heading text-xl font-bold">
                  No batteries found
                </h3>

                <p className="mt-2 text-slate-500">
                  Try another category or search.
                </p>

                <Button
                  onClick={clearFilters}
                  className="mt-5 rounded-full bg-orange-500 hover:bg-orange-600"
                >
                  Show All Batteries
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      {/* CART CONFIRMATION */}
      {cartMessage && (
        <div
          role="status"
          className="fixed bottom-36 left-1/2 z-[60] w-[calc(100%-32px)] max-w-sm -translate-x-1/2 rounded-2xl border border-orange-200 bg-white/95 p-4 text-center shadow-2xl backdrop-blur-xl"
        >
          <p className="text-sm font-semibold text-slate-800">
            {cartMessage}
          </p>

          <div className="mt-3 flex items-center justify-center gap-4">
            <Link
              href="/cart"
              className="text-sm font-bold text-orange-600 underline"
            >
              View Cart
            </Link>

            <button
              type="button"
              onClick={() => setCartMessage("")}
              className="text-sm text-slate-500"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-orange-100 bg-white/70 px-6 pb-40 pt-12 text-center backdrop-blur-xl">
        <h2 className="font-heading text-xl font-extrabold">
          PROJECT<span className="text-orange-500">BATTERY</span>
        </h2>

        <p className="mt-3 text-sm text-slate-500">
          Powering Mumbai & Navi Mumbai.
        </p>

        <p className="mt-6 text-xs text-slate-400">
          Development Preview
        </p>
      </footer>
    </main>
  );
}
