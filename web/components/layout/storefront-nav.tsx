
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  LayoutGrid,
  Search,
  ShoppingCart,
  Zap,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { label: "Home", href: "/", icon: House },
  { label: "Categories", href: "/#manufacturers", icon: LayoutGrid },
  { label: "Products", href: "/#products", icon: Search },
  { label: "Cart", href: "/cart", icon: ShoppingCart },
];

function activeSection() {
  const navBottom =
    document
      .querySelector("[data-storefront-nav]")
      ?.getBoundingClientRect().bottom ?? 90;

  const position = window.scrollY + navBottom + 24;

  const sections = [
    { id: "manufacturers", index: 1 },
    { id: "products", index: 2 },
  ]
    .map(({ id, index }) => {
      const el = document.getElementById(id);

      return el
        ? {
          index,
          top: el.getBoundingClientRect().top + window.scrollY,
        }
        : null;
    })
    .filter(
      (value): value is { index: number; top: number } =>
        value !== null
    )
    .sort((a, b) => a.top - b.top);

  let active = 0;

  for (const section of sections) {
    if (position >= section.top) active = section.index;
  }

  return active;
}

export function StorefrontNav() {
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);

  const [homeActiveIndex, setHomeActiveIndex] = useState(0);
  const activeIndex = pathname === "/cart" ? 3 : pathname === "/" ? homeActiveIndex : -1;

  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (pathname !== "/") return;

    const onScroll = () => setHomeActiveIndex(activeSection());

    const onHash = () => {
      const hash = window.location.hash;

      const index = navItems.findIndex(
        (item) => Boolean(hash) && item.href === `/${hash}`
      );

      if (index >= 0) {
        setHomeActiveIndex(index);
      } else {
        onScroll();
      }
    };

    onHash();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("hashchange", onHash);
    window.addEventListener("popstate", onHash);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("popstate", onHash);
    };
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    const outside = (event: PointerEvent) => {
      if (
        navRef.current &&
        !navRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    };

    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    const resize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };

    document.addEventListener("pointerdown", outside);
    window.addEventListener("keydown", key);
    window.addEventListener("resize", resize);

    return () => {
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("keydown", key);
      window.removeEventListener("resize", resize);
    };
  }, [menuOpen]);

  const choose = (index: number) => {
    setHomeActiveIndex(index);
    setMenuOpen(false);
  };

  return (
    <div
      ref={navRef}
      data-storefront-nav
      className="sticky top-[max(12px,env(safe-area-inset-top))] z-50 mx-auto w-[calc(100%-24px)] max-w-[1040px] md:top-4 md:w-[calc(100%-40px)]"
    >
      {/* MAIN GLASS NAVBAR */}
      <nav
        aria-label="Main navigation"
        className="relative isolate overflow-hidden rounded-[20px] border border-white/75 bg-white/55 p-[7px] shadow-[0_8px_28px_rgba(32,69,96,0.09),0_2px_6px_rgba(32,69,96,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-[#89CFF0]/15 backdrop-blur-[18px] backdrop-saturate-[150%]"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-4 top-0 h-px bg-white/90"
        />

        <div className="relative z-10 flex items-center justify-between gap-2 md:gap-0">
          {/* LOGO */}
          <Link
            href="/"
            onClick={() => choose(0)}
            aria-label="Project Battery home"
            className="flex h-[54px] min-w-0 shrink-0 items-center gap-[9px] rounded-[12px] px-2 focus-visible:outline-2 focus-visible:outline-[#438FBA] md:h-[60px] md:w-[218px] md:px-3"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border border-white/80 bg-[#89CFF0]/70 text-[#184A69] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_3px_8px_rgba(36,105,145,0.1)]">
              <Zap
                size={19}
                strokeWidth={2}
                fill="currentColor"
              />
            </span>

            <span className="whitespace-nowrap text-[13px] font-extrabold tracking-[-0.055em] text-[#22374B] sm:text-[14px]">
              PROJECT
              <span className="text-[#4C9FC9]">
                BATTERY
              </span>
            </span>
          </Link>

          {/* MOBILE MENU BUTTON */}
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="storefront-mobile-menu"
            onClick={() => setMenuOpen((value) => !value)}
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px] border border-white/75 bg-white/45 text-[#24445C] shadow-sm hover:bg-[#89CFF0]/30 focus-visible:outline-2 focus-visible:outline-[#438FBA] md:hidden"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* DESKTOP NAVIGATION */}
          <div className="relative hidden h-[60px] min-w-0 flex-1 grid-cols-4 md:grid">
            {/* BLUE SLIDING GLASS */}
            {activeIndex >= 0 && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-1 left-0 w-1/4 transition-transform duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                style={{
                  transform: `translateX(${activeIndex * 100}%)`,
                }}
              >
                <div className="relative mx-auto h-full w-[calc(100%-10px)] max-w-[112px] overflow-hidden rounded-[14px] border border-white/65 bg-[#89CFF0]/90 shadow-[0_4px_12px_rgba(53,128,175,0.15),inset_0_1px_0_rgba(255,255,255,0.65),inset_0_-1px_0_rgba(27,90,130,0.08)] backdrop-blur-[12px]">
                  <div className="absolute inset-x-3 top-0 h-px bg-white/80" />
                </div>
              </div>
            )}

            {navItems.map((item, index) => {
              const Icon = item.icon;
              const active = index === activeIndex;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => choose(index)}
                  aria-current={
                    active
                      ? item.href.startsWith("/#")
                        ? "location"
                        : "page"
                      : undefined
                  }
                  className={`relative z-10 flex min-w-0 flex-col items-center justify-center gap-[3px] rounded-[14px] text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#438FBA] ${active
                      ? "text-[#183C56]"
                      : "text-[#566B7B] hover:text-[#213E54]"
                    }`}
                >
                  <Icon
                    aria-hidden="true"
                    size={20}
                    strokeWidth={active ? 2.2 : 1.9}
                  />

                  <span
                    className={`whitespace-nowrap text-[11px] leading-[14px] tracking-[-0.02em] ${active ? "font-semibold" : "font-medium"
                      }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* FLOATING MOBILE DROPDOWN */}
      {menuOpen && (
        <div
          id="storefront-mobile-menu"
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[calc(100dvh-110px)] overflow-y-auto rounded-[20px] border border-white/75 bg-[#F7FBFD]/85 p-[7px] shadow-[0_16px_40px_rgba(32,69,96,0.14)] ring-1 ring-[#89CFF0]/15 backdrop-blur-[22px] md:hidden"
        >
          <div className="flex flex-col gap-1">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const active = index === activeIndex;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => choose(index)}
                  aria-current={
                    active
                      ? item.href.startsWith("/#")
                        ? "location"
                        : "page"
                      : undefined
                  }
                  className={`flex min-h-12 items-center gap-3 rounded-[13px] border px-4 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-[#438FBA] ${active
                      ? "border-white/65 bg-[#89CFF0]/90 font-semibold text-[#183C56] shadow-sm"
                      : "border-transparent font-medium text-[#566B7B] hover:bg-white/50"
                    }`}
                >
                  <Icon
                    aria-hidden="true"
                    size={19}
                    strokeWidth={active ? 2.2 : 1.9}
                  />

                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
