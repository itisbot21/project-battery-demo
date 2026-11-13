
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import BatteryFinder from "@/components/battery-finder";
import PincodeChecker from "@/components/pincode-checker";

// The structure of a product returned by our API
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
  { name: "Car", icon: "🚗" },
  { name: "Bike", icon: "🏍️" },
  { name: "Inverter", icon: "🔋" },
  { name: "Truck", icon: "🚚" },
];

// Convert database paise into formatted rupees
function formatPrice(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: paise % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(paise / 100);
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("All");
  const [vehicle, setVehicle] =
    useState<SelectedVehicle | null>(null);

  const [finderKey, setFinderKey] = useState(0);

  // Fetch products from our actual database API
  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      try {
        const response = await fetch("/api/products", {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load products");
        }

        const data: unknown = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Invalid product response");
        }

        if (!controller.signal.aborted) {
          setProducts(data as Product[]);
          setError("");
        }
      } catch {
        if (!controller.signal.aborted) {
          setError("Could not load batteries. Please try again.");
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

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selected === "All" || product.category === selected;

    const matchesSearch =
      `${product.brand} ${product.model} ${product.category}`
        .toLowerCase()
        .includes(search.toLowerCase());

    // Temporary category filtering, not exact fitment
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
    setFinderKey((previous) => previous + 1);
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* Announcement Bar */}
      <div className="bg-orange-600 px-4 py-2 text-center text-sm font-medium text-white">
        Free Delivery & Installation in Mumbai and Navi Mumbai
      </div>

      {/* Navbar */}
      <header className="border-b bg-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">

          <a href="/" className="text-xl font-extrabold">
            PROJECT
            <span className="text-orange-600">BATTERY</span>
          </a>

          <div className="hidden gap-8 text-sm font-medium md:flex">
            <a href="#categories">Categories</a>
            <a href="#products">Batteries</a>
            <a href="#services">Services</a>
          </div>

          <span className="text-xs text-slate-500">
            Mumbai & Navi Mumbai
          </span>
        </nav>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-r from-slate-950 to-slate-800 px-6 py-20 text-white">
        <div className="mx-auto max-w-7xl">

          <p className="font-semibold text-orange-400">
            YOUR BATTERY SHOPPING DESTINATION
          </p>

          <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
            Power Your Journey.
            <span className="text-orange-500">
              {" "}Find Your Perfect Battery.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg text-slate-300">
            Shop car, bike, inverter and truck batteries
            with free delivery, installation and
            old battery exchange.
          </p>

          <div className="mt-8 max-w-xl">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search batteries by brand or model..."
              className="h-12 bg-white text-slate-900"
            />
          </div>

          <a
            href="#products"
            className="mt-6 inline-block rounded-lg bg-orange-600 px-7 py-3 font-semibold text-white hover:bg-orange-700"
          >
            Browse Batteries →
          </a>

        </div>
      </section>

     <PincodeChecker />

      {/* Vehicle Battery Finder */}
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

      {/* Categories */}
      <section
        id="categories"
        className="mx-auto max-w-7xl px-6 py-16"
      >
        <h2 className="text-3xl font-bold">
          Shop by Category
        </h2>

        <p className="mt-2 text-slate-500">
          Browse batteries by vehicle or application.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {categories.map((category) => (
            <button
              type="button"
              key={category.name}
              onClick={() => {
                setSelected(category.name);
                setVehicle(null);
                setFinderKey((previous) => previous + 1);
              }}
              className={`rounded-2xl border p-8 text-center transition hover:shadow-lg ${
                selected === category.name
                  ? "border-orange-500 bg-orange-50"
                  : "bg-white"
              }`}
            >
              <div className="text-5xl">
                {category.icon}
              </div>

              <h3 className="mt-4 font-semibold">
                {category.name} Batteries
              </h3>
            </button>
          ))}
        </div>
      </section>

      {/* Products */}
      <section
        id="products"
        className="mx-auto max-w-7xl scroll-mt-8 px-6 pb-20"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-3xl font-bold">
            Explore Batteries
          </h2>

          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>

        {vehicle && (
          <div className="mt-5 rounded-xl border border-orange-200 bg-orange-50 p-4">
            <p className="font-semibold text-orange-900">
              Selected Vehicle: {vehicle.name}
            </p>

            <p className="mt-1 text-sm text-orange-800">
              Showing batteries from the {vehicle.type} category.
              Exact compatibility has not been verified yet.
            </p>
          </div>
        )}

        <p className="mt-4 text-sm text-slate-500">
          Product data loaded from Neon PostgreSQL.
          Demo prices include GST.
        </p>

        {/* Loading */}
        {loading && (
          <div className="mt-10 text-center text-slate-500">
            Loading batteries...
          </div>
        )}

        {/* API Error */}
        {error && !loading && (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
            {error}
            <Button
              variant="outline"
              className="ml-3"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        )}

        {!loading && !error && (
          <>
            <p className="mt-3 text-sm text-slate-500">
              {filteredProducts.length} products found
            </p>

            {/* Real Database Product Grid */}
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

              {filteredProducts.map((product) => (
                <Card key={product.id}>
                  <CardContent className="p-5">

                    <div className="flex h-36 items-center justify-center rounded-xl bg-slate-100 text-5xl">
                      🔋
                    </div>

                    <p className="mt-5 text-xs font-semibold uppercase text-orange-600">
                      {product.brand}
                    </p>

                    <h3 className="mt-1 text-lg font-bold">
                      {product.model}
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                      {product.category} Battery
                    </p>

                    {product.capacityAh !== null && (
                      <p className="text-sm text-slate-500">
                        Capacity: {product.capacityAh} Ah
                      </p>
                    )}

                    {product.warrantyMonths !== null && (
                      <p className="text-sm text-slate-500">
                        Warranty: {product.warrantyMonths} months
                      </p>
                    )}

                    <div className="my-4 border-t" />

                    <p className="text-sm text-slate-500">
                      MRP:{" "}
                      <s>{formatPrice(product.mrpPaise)}</s>
                    </p>

                    <p className="mt-3 text-sm text-slate-600">
                      Without Old Battery
                    </p>

                    <p className="text-lg font-bold">
                      {formatPrice(product.withoutExchangePaise)}
                    </p>

                    <p className="mt-3 text-sm text-slate-600">
                      With Old Battery
                    </p>

                    <p className="text-2xl font-bold text-green-700">
                      {formatPrice(product.withExchangePaise)}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      Inclusive of GST
                    </p>

                    <div className="mt-4 rounded-lg bg-green-50 p-3">
                      <p className="text-sm font-medium text-green-800">
                        Save{" "}
                        {formatPrice(
                          product.withoutExchangePaise -
                          product.withExchangePaise
                        )}{" "}
                        with exchange
                      </p>
                    </div>

                    <div className="mt-4">
                      {product.stock > 0 ? (
                        <p className="text-sm font-medium text-green-700">
                          ● In Stock
                        </p>
                      ) : (
                        <p className="text-sm font-medium text-red-600">
                          ● Out of Stock
                        </p>
                      )}
                    </div>

                  </CardContent>
                </Card>
              ))}

            </div>

            {filteredProducts.length === 0 && (
              <div className="mt-10 rounded-xl border bg-white p-10 text-center">
                <p className="text-lg font-semibold">
                  No batteries found
                </p>

                <p className="mt-2 text-slate-500">
                  Try another search or category.
                </p>

                <Button
                  className="mt-5"
                  variant="outline"
                  onClick={clearFilters}
                >
                  Show All Batteries
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Services */}
      <section id="services" className="bg-white px-6 py-12">
        <div className="mx-auto grid max-w-7xl gap-6 text-center md:grid-cols-3">
          <div>
            <div className="text-3xl">🚚</div>
            <h3 className="mt-2 font-semibold">
              Free Doorstep Delivery
            </h3>
          </div>

          <div>
            <div className="text-3xl">🔧</div>
            <h3 className="mt-2 font-semibold">
              Free Installation
            </h3>
          </div>

          <div>
            <div className="text-3xl">♻️</div>
            <h3 className="mt-2 font-semibold">
              Old Battery Exchange
            </h3>
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 px-6 py-8 text-center text-sm text-slate-400">
        Project Battery — Development Preview
      </footer>

    </main>
  );
}