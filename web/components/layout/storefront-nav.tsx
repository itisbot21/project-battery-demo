"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { Popover } from "@base-ui/react/popover";
import { ChevronRight, Menu, ShoppingBag, UserRound } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { authClient } from "@/lib/auth-client";
import { getCartCount, subscribeToCart } from "@/lib/cart";
import { Brand } from "@/components/design/brand";
import { ModalSurface } from "@/components/design/modal";
import { Notice } from "@/components/design/commerce-ui";

const links = [
  { href: "/shop", label: "Shop" },
  { href: "/car-batteries", label: "Car batteries" },
  { href: "/bike-batteries", label: "Bike batteries" },
  { href: "/track-order", label: "Track order" },
];

export function StorefrontNav() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const count = useSyncExternalStore(subscribeToCart, getCartCount, () => 0);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = session?.user;
  const admin = (user as { role?: string } | undefined)?.role?.split(",").some((role) => role.trim() === "admin");

  function active(href: string) {
    return pathname === href || (href !== "/" && pathname.startsWith(href + "/")) ? "page" : undefined;
  }

  async function changeSession() {
    setError("");
    setPending(true);
    try {
      const result = user ? await authClient.signOut()
        : await authClient.signIn.social({ provider: "google", callbackURL: pathname });
      if (result.error) throw new Error();
    } catch {
      setError(user ? "Unable to sign out. Please try again." : "Google sign-in is currently unavailable.");
    } finally {
      setPending(false);
    }
  }

  const account = <>
    {user && <strong>{user.name}</strong>}
    {admin && <Link className="text-link" href="/admin">Store operations</Link>}
    <button className="shop-button" type="button" onClick={changeSession} disabled={pending}>
      {pending ? "Please wait…" : user ? "Sign out" : "Continue with Google"}
    </button>
    {error && <Notice tone="critical">{error}</Notice>}
  </>;

  return <header className="store-header">
    <a className="store-skip" href="#main-content">Skip to content</a>
    <div className="store-container store-header-inner">
      <Brand />
      <nav className="store-nav" aria-label="Main navigation">
        {links.map(({ href, label }) => <Link key={href} href={href} aria-current={active(href)}>{label}</Link>)}
      </nav>
      <div className="store-tools">
        <Popover.Root onOpenChange={(open) => { if (open) setError(""); }}>
          <Popover.Trigger type="button" className="icon-button store-account-trigger" aria-label={user ? "Account" : "Sign in"}>
            <UserRound size={19} aria-hidden="true" />
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner className="account-positioner" align="end" sideOffset={8}>
              <Popover.Popup className="account-popup">
                <Popover.Title>{user ? "Your account" : "Sign in"}</Popover.Title>{account}
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
        <Link href="/cart" className="shop-button store-cart" aria-label={"Cart, " + count + (count === 1 ? " item" : " items")}>
          <ShoppingBag size={18} aria-hidden="true" />
          <span className="store-cart-copy">Cart</span><span className="cart-count" aria-hidden="true">{count}</span>
        </Link>
        <Dialog.Root open={mobileOpen} onOpenChange={(open) => { setMobileOpen(open); if (open) setError(""); }}>
          <Dialog.Trigger type="button" className="icon-button mobile-menu-trigger" aria-label="Open menu"><Menu size={21} aria-hidden="true" /></Dialog.Trigger>
          <ModalSurface title="Menu" kind="drawer">
            <nav className="mobile-navigation" aria-label="Main navigation">
              {[{ href: "/", label: "Home" }, ...links, { href: "/contact", label: "Support" }].map(({ href, label }) =>
                <Link key={href} href={href} aria-current={active(href)} onClick={() => setMobileOpen(false)}>
                  {label}<ChevronRight size={17} aria-hidden="true" />
                </Link>)}
            </nav>
            <div className="account-popup">{account}</div>
          </ModalSurface>
        </Dialog.Root>
      </div>
    </div>
  </header>;
}
