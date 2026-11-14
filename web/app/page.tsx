
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BatteryCharging,
  BatteryFull,
  Bike,
  CarFront,
  PackageCheck,
  Recycle,
  RotateCcw,
  ShoppingCart,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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
] as const;

const glass =
  "border border-white/85 bg-white/60 shadow-[0_10px_32px_rgba(32,72,102,0.07),inset_0_1px_0_rgba(255,255,255,0.8)] ring-1 ring-[#89CFF0]/10 backdrop-blur-[18px]";

const roadMask =
  "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,.06) 8%, rgba(0,0,0,.38) 18%, rgba(0,0,0,.82) 30%, black 42%)";

function formatPrice(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
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
  const [cartMessage, setCartMessage] = useState("");

  const heroSceneRef = useRef<HTMLElement>(null);
  const heroPanelRef = useRef<HTMLDivElement>(null);
  const heroVisualRef = useRef<HTMLDivElement>(null);

  // SCROLL FADE
  // Only the image, artwork and hero copy fade.
  // The battery finder stays sharp and fully visible.
  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;

      const scene = heroSceneRef.current;
      const panel = heroPanelRef.current;
      const visual = heroVisualRef.current;

      if (!scene || !panel || !visual) return;

      const travel = Math.max(
        1,
        scene.offsetHeight - panel.offsetHeight
      );

      const scrolled = Math.max(
        0,
        -scene.getBoundingClientRect().top
      );

      // Start fading shortly after scrolling begins.
      const start = Math.min(50, travel * 0.1);

      // Finish while the finder is near viewport centre,
      // before the sticky hero reaches its boundary.
      const end = Math.max(
        start + 100,
        Math.min(
          travel * 0.64,
          window.innerHeight * 0.36
        )
      );

      const progress = Math.max(
        0,
        Math.min(
          1,
          (scrolled - start) / (end - start)
        )
      );

      // Smoothstep easing prevents a harsh transition.
      const eased =
        progress * progress * (3 - 2 * progress);

      // Unlike the old 82% overlay,
      // this reaches complete transparency.
      visual.style.opacity = String(1 - eased);
    };

    const onScroll = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(update);
      }
    };

    window.addEventListener("scroll", onScroll, {
      passive: true,
    });

    window.addEventListener("resize", onScroll);

    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);

      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  // LOAD PRODUCT DATA
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

  function selectCategory(category: string) {
    setSelected(category);
    setSearch("");
    setVehicle(null);
    setFinderKey((key) => key + 1);

    document
      .getElementById("products")
      ?.scrollIntoView({ behavior: "smooth" });
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

      {/* FULL-WIDTH STICKY HERO */}
      <section
        ref={heroSceneRef}
        className="relative isolate z-10 w-full"
      >
        {/* STICKY BACKGROUND PANEL */}
        <div
          ref={heroPanelRef}
          className="sticky top-0 z-0 h-[82svh] min-h-[min(470px,85svh)] max-h-[780px] w-full overflow-hidden"
        >
          {/* FADING VISUAL GROUP */}
          <div
            ref={heroVisualRef}
            className="absolute inset-0 will-change-[opacity]"
          >
            {/* ROAD IMAGE + TRANSPARENT TOP FADE */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                WebkitMaskImage: roadMask,
                maskImage: roadMask,
              }}
            >
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage:
                    "url('/images/hero-road.png')",
                }}
              />

              {/* DARK READABILITY GRADIENT */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#10283A]/90 via-[#17364E]/55 to-[#17364E]/15" />

              {/* SUBTLE BOTTOM SHADING */}
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#10283A]/25 to-transparent" />
            </div>

            {/* HERO TEXT */}
            <div className="relative z-10 mx-auto flex h-full max-w-[1280px] items-center px-5 pb-14 pt-20 sm:px-8 sm:pb-20 sm:pt-24 lg:pb-24">
              <div className="max-w-[660px]">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#C6EAFA] sm:text-xs">
                  Car &amp; bike batteries
                </p>

                <h1 className="mt-4 font-heading text-[clamp(2rem,5vw,4.8rem)] font-extrabold leading-[1.03] tracking-[-0.05em] text-white">
                  Reliable batteries.

                  <span className="mt-2 block text-[#DCF5FF]">
                    Delivered &amp; installed.
                  </span>
                </h1>

                <p className="mt-5 max-w-[570px] text-[14px] leading-6 text-white/90 sm:text-[16px] sm:leading-7">
                  Shop genuine car and bike batteries in
                  Mumbai and Navi Mumbai. Free doorstep
                  delivery, installation and old battery
                  exchange.
                </p>
              </div>
            </div>

            {/* BATTERY PRODUCT ARTWORK */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-[12%] right-[4%] z-10 hidden h-[52%] w-[38%] bg-contain bg-bottom bg-no-repeat lg:block"
              style={{
                backgroundImage:
                  "url('/images/hero-batteries.png')",
              }}
            />
          </div>
        </div>

        {/* BATTERY FINDER SCROLLS OVER HERO */}
        <div className="relative z-20 mx-auto -mt-14 w-[calc(100%-24px)] max-w-[1140px] sm:-mt-20 sm:w-[calc(100%-48px)]">
          <BatteryFinder
            key={finderKey}
            availableBrands={[
              ...new Set(
                sellableProducts.map(
                  (product) => product.brand
                )
              ),
            ].sort()}
            onSearch={(selection) => {
              setSelected(selection.type);
              setSearch(selection.batteryBrand);

              setVehicle({
                type: selection.type,
                name: [
                  selection.brand,
                  selection.model,
                  selection.variant,
                ]
                  .filter(Boolean)
                  .join(" "),
              });

              document
                .getElementById("products")
                ?.scrollIntoView({
                  behavior: "smooth",
                });
            }}
          />
        </div>

        {/* TRANSPARENT SCROLL RUNWAY */}
        {/* Allows the image to fully fade before unsticking */}
        <div
          aria-hidden="true"
          className="h-[clamp(110px,16svh,190px)]"
        />
      </section>

      {/* SERVICES STRIP */}
      <section className="relative z-10 mx-auto max-w-[1160px] px-5 pb-10 sm:px-8">
        <div
          className={`grid gap-2 rounded-[18px] p-3 sm:grid-cols-3 ${glass}`}
        >
          {[
            {
              title: "Free delivery",
              icon: PackageCheck,
            },
            {
              title: "Free installation",
              icon: Wrench,
            },
            {
              title: "Old battery exchange",
              icon: Recycle,
            },
          ].map(({ title, icon: Icon }) => (
            <div
              key={title}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold text-[#36556C]"
            >
              <Icon
                aria-hidden="true"
                size={18}
                className="text-[#309A64]"
              />
              {title}
            </div>
          ))}
        </div>
      </section>

      {/* DELIVERY PIN CODE CHECKER */}
      <section className="mx-auto max-w-[1160px] px-5 pb-16 sm:px-8">
        <div
          className={`rounded-[20px] p-4 sm:p-6 ${glass}`}
        >
          <PincodeChecker />
        </div>
      </section>

      {/* CATEGORIES */}
      <section
        id="categories"
        className="mx-auto max-w-[1160px] scroll-mt-32 px-5 pb-16 sm:px-8"
      >
        <h2 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
          Shop by category
        </h2>

        <p className="mt-2 text-sm text-[#688092]">
          Choose your vehicle type.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:max-w-[600px] sm:gap-4">
          {categories.map(({ name, icon: Icon }) => (
            <button
              key={name}
              type="button"
              onClick={() => selectCategory(name)}
              className={`group flex items-center gap-3 rounded-[18px] p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-[#398DB9] sm:p-5 ${selected === name
                  ? "border border-[#89CFF0] bg-[#DDF2FC]/80 shadow-sm"
                  : `${glass} hover:border-[#89CFF0]`
                }`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E2F3FB] text-[#367EA5] sm:h-12 sm:w-12">
                <Icon
                  size={24}
                  strokeWidth={1.7}
                />
              </span>

              <span className="text-sm font-bold text-[#274B64] sm:text-base">
                {name} batteries
              </span>

              <ArrowRight
                size={17}
                className="ml-auto hidden text-[#398DB9] sm:block"
              />
            </button>
          ))}
        </div>
      </section>

      {/* PRODUCT CATALOG */}
      <section
        id="products"
        className="mx-auto max-w-[1160px] scroll-mt-32 px-5 pb-20 sm:px-8"
      >
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
            <RotateCcw
              size={15}
              className="mr-2"
            />
            Clear filters
          </Button>
        </div>

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

        {loading && (
          <p className="mt-8 text-sm text-[#688092]">
            Loading batteries...
          </p>
        )}

        {error && !loading && (
          <div className="mt-8 rounded-[18px] border border-red-200 bg-red-50 p-5">
            <p className="text-sm text-red-700">
              {error}
            </p>

            <Button
              variant="outline"
              className="mt-3"
              onClick={() =>
                window.location.reload()
              }
            >
              Retry
            </Button>
          </div>
        )}

        {!loading && !error && (
          <>
            <p className="mt-5 text-xs text-[#688092]">
              {filteredProducts.length} batteries found
            </p>

            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => (
                <article
                  key={product.id}
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
                          addBattery(product, "with")
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
                          addBattery(
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
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div
                className={`mt-6 rounded-[18px] p-8 text-center ${glass}`}
              >
                <BatteryCharging
                  size={36}
                  className="mx-auto text-[#398DB9]"
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
      </footer>
    </main>
  );
}
