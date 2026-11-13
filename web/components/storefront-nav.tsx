
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  LayoutGrid,
  BatteryCharging,
  Search,
  ShoppingCart,
} from "lucide-react";

const navItems = [
  {
    label: "Home",
    href: "/",
    icon: House,
  },
  {
    label: "Categories",
    href: "/#categories",
    icon: LayoutGrid,
  },
  {
    label: "Find Battery",
    href: "/#battery-finder",
    icon: BatteryCharging,
  },
  {
    label: "Products",
    href: "/#products",
    icon: Search,
  },
  {
    label: "Cart",
    href: "/cart",
    icon: ShoppingCart,
  },
];

const sections = [
  { id: "battery-finder", index: 2 },
  { id: "categories", index: 1 },
  { id: "products", index: 3 },
];

function getActiveSection() {
  if (typeof window === "undefined") return 0;

  const position = window.scrollY + 170;
  let active = 0;

  for (const section of sections) {
    const element = document.getElementById(section.id);

    if (!element) continue;

    const top =
      element.getBoundingClientRect().top +
      window.scrollY;

    if (position >= top) {
      active = section.index;
    }
  }

  return active;
}

export default function StorefrontNav() {
  const pathname = usePathname();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (pathname !== "/") {
      setActiveIndex(pathname === "/cart" ? 4 : -1);
      return;
    }

    const updateFromScroll = () => {
      setActiveIndex(getActiveSection());
    };

    const updateFromHash = () => {
      const hash = window.location.hash;

      const index = navItems.findIndex(
        (item) => item.href === `/${hash}`
      );

      if (hash && index >= 0) {
        setActiveIndex(index);
      } else {
        updateFromScroll();
      }
    };

    updateFromHash();

    window.addEventListener("hashchange", updateFromHash);
    window.addEventListener("popstate", updateFromHash);
    window.addEventListener("scroll", updateFromScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener(
        "hashchange",
        updateFromHash
      );
      window.removeEventListener(
        "popstate",
        updateFromHash
      );
      window.removeEventListener(
        "scroll",
        updateFromScroll
      );
    };
  }, [pathname]);

  return (
    <div className="fixed left-1/2 top-5 z-50 w-[calc(100%-24px)] max-w-[700px] -translate-x-1/2">
      {/* REAR GLASS LAYER */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-4 top-3 h-[90px] rounded-[36px] border border-white/40 bg-white/20 shadow-lg backdrop-blur-xl"
      />

      {/* MAIN GLASS NAV */}
      <nav
        aria-label="Main navigation"
        className="relative isolate grid h-[94px] grid-cols-5 items-center rounded-[34px] border border-white/80 bg-white/65 px-2 shadow-[0_12px_40px_rgba(0,0,0,0.16),inset_0_2px_2px_rgba(255,255,255,0.9)] backdrop-blur-[32px] backdrop-saturate-150"
      >
        {/* GLASS SHINE */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[34px] bg-gradient-to-b from-white/45 via-white/10 to-transparent"
        />

        {/* MOVING GREEN INDICATOR */}
        {activeIndex >= 0 && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-1 left-2 top-1 z-0 rounded-[27px] border border-green-300/60 bg-gradient-to-br from-[#50df64] via-[#32bf4d] to-[#159d35] shadow-[0_8px_22px_rgba(34,197,94,0.28),inset_0_2px_3px_rgba(255,255,255,0.35)] transition-transform duration-500 ease-in-out"
            style={{
              width: "calc((100% - 16px) / 5)",
              transform: `translateX(${activeIndex * 100}%)`,
            }}
          />
        )}

        {/* NAV ITEMS */}
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const active = activeIndex === index;

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setActiveIndex(index)}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className={`
                group relative z-10 flex h-[86px]
                min-w-0 flex-col items-center
                justify-center gap-1 rounded-[26px]
                transition-colors duration-300
                ${
                  active
                    ? "text-white"
                    : "text-[#171b37] hover:text-green-700"
                }
              `}
            >
              <Icon
                size={27}
                strokeWidth={1.9}
                className="transition-transform duration-300 group-hover:scale-110 sm:size-[29px]"
              />

              <span
                className={`
                  px-1 text-center
                  text-[10px] font-medium leading-tight
                  sm:text-xs
                  ${
                    active
                      ? "font-semibold text-white"
                      : "text-slate-700"
                  }
                `}
              >
                {item.label}
              </span>

              {active && (
                <span className="absolute bottom-2 h-[3px] w-6 rounded-full bg-white/60" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
