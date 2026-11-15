
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createAuthClient } from "better-auth/react";

import {
  House,
  Info,
  ShoppingCart,
  Zap,
  Menu,
  X,
  LogIn,
  LogOut,
  UserRound,
  ChevronDown,
} from "lucide-react";

// Uses the Better Auth server on this website.
const authClient = createAuthClient();

const navItems = [
  { label: "Home", href: "/", icon: House },
  { label: "About", href: "/about", icon: Info },
  { label: "Cart", href: "/cart", icon: ShoppingCart },
];

export function StorefrontNav() {
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);

  const { data: session, isPending } =
    authClient.useSession();

  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");

  const activeIndex = navItems.findIndex(
    (item) => item.href === pathname
  );

  const user = session?.user;
  const displayName = user?.name?.trim() || "Account";

  // Close menus when navigating to another page.
  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  // Outside click and Escape key.
  useEffect(() => {
    if (!menuOpen && !accountOpen) return;

    function handleOutside(event: PointerEvent) {
      if (
        navRef.current &&
        !navRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
        setAccountOpen(false);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setAccountOpen(false);
      }
    }

    function handleResize() {
      if (window.innerWidth >= 768) {
        setMenuOpen(false);
      } else {
        setAccountOpen(false);
      }
    }

    document.addEventListener(
      "pointerdown",
      handleOutside
    );
    window.addEventListener("keydown", handleKey);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener(
        "pointerdown",
        handleOutside
      );
      window.removeEventListener(
        "keydown",
        handleKey
      );
      window.removeEventListener(
        "resize",
        handleResize
      );
    };
  }, [menuOpen, accountOpen]);

  function closeMenus() {
    setMenuOpen(false);
    setAccountOpen(false);
    setAuthError("");
  }

  // REAL GOOGLE SIGN-IN
  async function handleGoogleLogin() {
    if (authBusy) return;

    closeMenus();
    setAuthBusy(true);

    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      });

      if (error) {
        setAuthError(
          error.message || "Could not start Google login."
        );
      }
    } catch {
      setAuthError(
        "Google login failed. Please try again."
      );
    } finally {
      setAuthBusy(false);
    }
  }

  // REAL SIGN-OUT
  async function handleSignOut() {
    if (authBusy) return;

    setAuthBusy(true);
    setAuthError("");

    try {
      const { error } = await authClient.signOut();

      if (error) {
        setAuthError(
          error.message || "Could not sign out."
        );
        return;
      }

      closeMenus();

      // Refresh the page with the signed-out session.
      window.location.assign("/");
    } catch {
      setAuthError(
        "Could not sign out. Please try again."
      );
    } finally {
      setAuthBusy(false);
    }
  }

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
        {/* GLASS HIGHLIGHT */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-4 top-0 h-px bg-white/90"
        />

        <div className="relative z-10 flex items-center justify-between gap-2 md:gap-0">
          {/* LOGO */}
          <Link
            href="/"
            onClick={closeMenus}
            aria-label="Project Battery home"
            className="flex h-[54px] min-w-0 shrink-0 items-center gap-[9px] rounded-[12px] px-2 focus-visible:outline-2 focus-visible:outline-[#438FBA] md:h-[60px] md:w-[218px] md:px-3"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border border-white/80 bg-[#89CFF0]/70 text-[#184A69] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_3px_8px_rgba(36,105,145,0.1)]">
              <Zap
                size={19}
                strokeWidth={2}
                fill="currentColor"
                aria-hidden="true"
              />
            </span>

            <span className="whitespace-nowrap text-[13px] font-extrabold tracking-[-0.055em] text-[#22374B] sm:text-[14px]">
              PROJECT
              <span className="text-[#4C9FC9]">
                BATTERY
              </span>
            </span>
          </Link>

          {/* MOBILE HAMBURGER */}
          <button
            type="button"
            aria-label={
              menuOpen ? "Close menu" : "Open menu"
            }
            aria-expanded={menuOpen}
            aria-controls="storefront-mobile-menu"
            onClick={() => {
              setMenuOpen((value) => !value);
              setAccountOpen(false);
            }}
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px] border border-white/75 bg-white/45 text-[#24445C] shadow-sm hover:bg-[#89CFF0]/30 focus-visible:outline-2 focus-visible:outline-[#438FBA] md:hidden"
          >
            {menuOpen ? (
              <X size={22} aria-hidden="true" />
            ) : (
              <Menu size={22} aria-hidden="true" />
            )}
          </button>

          {/* DESKTOP NAVIGATION — 4 COLUMNS */}
          <div className="relative hidden h-[60px] min-w-0 flex-1 grid-cols-4 md:grid">
            {/* BLUE SLIDING GLASS */}
            {activeIndex >= 0 && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-1 left-0 w-1/4 transition-transform duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                style={{
                  transform: `translateX(${activeIndex * 100
                    }%)`,
                }}
              >
                <div className="relative mx-auto h-full w-[calc(100%-10px)] max-w-[112px] overflow-hidden rounded-[14px] border border-white/65 bg-[#89CFF0]/90 shadow-[0_4px_12px_rgba(53,128,175,0.15),inset_0_1px_0_rgba(255,255,255,0.65),inset_0_-1px_0_rgba(27,90,130,0.08)] backdrop-blur-[12px]">
                  <div className="absolute inset-x-3 top-0 h-px bg-white/80" />
                </div>
              </div>
            )}

            {/* HOME / ABOUT / CART */}
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const active = index === activeIndex;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={closeMenus}
                  aria-current={
                    active ? "page" : undefined
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
                    className={`whitespace-nowrap text-[11px] leading-[14px] tracking-[-0.02em] ${active
                        ? "font-semibold"
                        : "font-medium"
                      }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}

            {/* GOOGLE LOGIN / ACCOUNT */}
            <div className="relative z-10 flex min-w-0 items-center justify-center">
              {isPending ? (
                <span className="text-[11px] text-[#8297A5]">
                  Loading...
                </span>
              ) : user ? (
                <button
                  type="button"
                  aria-expanded={accountOpen}
                  aria-controls="storefront-account-menu"
                  onClick={() =>
                    setAccountOpen((value) => !value)
                  }
                  className="flex h-full w-full min-w-0 flex-col items-center justify-center gap-[3px] rounded-[14px] px-2 text-[#566B7B] transition-colors hover:bg-white/35 hover:text-[#183C56] focus-visible:outline-2 focus-visible:outline-[#438FBA]"
                >
                  <UserRound
                    size={20}
                    aria-hidden="true"
                  />

                  <span className="flex max-w-full items-center gap-1">
                    <span className="max-w-[100px] truncate text-[11px] font-semibold">
                      {displayName}
                    </span>

                    <ChevronDown
                      size={12}
                      aria-hidden="true"
                    />
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={authBusy}
                  className="flex h-full w-full min-w-0 flex-col items-center justify-center gap-[3px] rounded-[14px] text-[#566B7B] transition-colors hover:bg-white/35 hover:text-[#183C56] focus-visible:outline-2 focus-visible:outline-[#438FBA] disabled:cursor-wait disabled:opacity-50"
                >
                  <LogIn
                    size={20}
                    aria-hidden="true"
                  />

                  <span className="whitespace-nowrap text-[11px] font-semibold leading-[14px] tracking-[-0.02em]">
                    {authBusy
                      ? "Connecting..."
                      : "Google Login"}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* DESKTOP ACCOUNT DROPDOWN */}
      {accountOpen && user && (
        <div
          id="storefront-account-menu"
          className="absolute right-0 top-full z-50 mt-2 hidden w-[250px] rounded-[17px] border border-white/80 bg-[#F7FBFD]/95 p-2 shadow-[0_16px_40px_rgba(32,69,96,0.14)] ring-1 ring-[#89CFF0]/15 backdrop-blur-[22px] md:block"
        >
          <div className="border-b border-[#DDEAF1] px-3 py-3">
            <p className="truncate text-[13px] font-bold text-[#22374B]">
              {displayName}
            </p>

            <p className="mt-1 truncate text-[11px] text-[#71899B]">
              {user.email}
            </p>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={authBusy}
            className="mt-1 flex min-h-11 w-full items-center gap-3 rounded-[11px] px-3 text-left text-[13px] font-semibold text-[#36556C] transition-colors hover:bg-[#E7F2F8] focus-visible:outline-2 focus-visible:outline-[#438FBA] disabled:opacity-50"
          >
            <LogOut size={17} aria-hidden="true" />

            {authBusy ? "Signing out..." : "Sign Out"}
          </button>
        </div>
      )}

      {/* FLOATING MOBILE DROPDOWN */}
      {menuOpen && (
        <div
          id="storefront-mobile-menu"
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[calc(100dvh-110px)] overflow-y-auto rounded-[20px] border border-white/75 bg-[#F7FBFD]/90 p-[7px] shadow-[0_16px_40px_rgba(32,69,96,0.14)] ring-1 ring-[#89CFF0]/15 backdrop-blur-[22px] md:hidden"
        >
          <div className="flex flex-col gap-1">
            {/* MOBILE NAV LINKS */}
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const active = index === activeIndex;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={closeMenus}
                  aria-current={
                    active ? "page" : undefined
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

            <div className="my-1 h-px bg-[#DDEAF1]" />

            {/* MOBILE AUTH */}
            {isPending ? (
              <p className="px-4 py-3 text-xs text-[#71899B]">
                Checking account...
              </p>
            ) : user ? (
              <>
                <div className="flex items-center gap-3 px-4 py-3">
                  <UserRound
                    size={20}
                    className="shrink-0 text-[#36556C]"
                    aria-hidden="true"
                  />

                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-bold text-[#22374B]">
                      {displayName}
                    </p>

                    <p className="truncate text-[11px] text-[#71899B]">
                      {user.email}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={authBusy}
                  className="flex min-h-12 items-center gap-3 rounded-[13px] px-4 text-left text-[13px] font-semibold text-[#36556C] hover:bg-white/60 focus-visible:outline-2 focus-visible:outline-[#438FBA] disabled:opacity-50"
                >
                  <LogOut
                    size={19}
                    aria-hidden="true"
                  />

                  {authBusy
                    ? "Signing out..."
                    : "Sign Out"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={authBusy}
                className="flex min-h-12 items-center gap-3 rounded-[13px] bg-[#89CFF0]/70 px-4 text-left text-[13px] font-bold text-[#183C56] hover:bg-[#89CFF0] focus-visible:outline-2 focus-visible:outline-[#438FBA] disabled:opacity-50"
              >
                <LogIn size={19} aria-hidden="true" />

                {authBusy
                  ? "Connecting..."
                  : "Continue with Google"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* AUTH ERROR */}
      {authError && (
        <div
          role="alert"
          className="absolute left-1/2 top-full z-[60] mt-2 w-[min(420px,calc(100vw-32px))] -translate-x-1/2 rounded-[13px] border border-red-200 bg-white px-4 py-3 text-center text-[12px] font-medium text-red-700 shadow-lg"
        >
          {authError}
        </div>
      )}
    </div>
  );
}