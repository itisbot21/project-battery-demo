import Link from "next/link";
import { StorefrontNav } from "@/components/layout/storefront-nav";

export default function NotFound() {
  return <><StorefrontNav /><main className="store-container store-section" id="main-content" tabIndex={-1}>
    <section className="panel empty-catalog"><h1>Page unavailable</h1>
      <p>This page may have moved or the listing may have been removed.</p>
      <Link className="shop-button primary" href="/shop">Browse batteries</Link>
    </section>
  </main></>;
}
