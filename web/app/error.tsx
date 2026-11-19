"use client";

import Link from "next/link";
import { StorefrontNav } from "@/components/layout/storefront-nav";

export default function StoreError({ reset }: { reset: () => void }) {
  return <><StorefrontNav /><main className="store-container store-section" id="main-content" tabIndex={-1}>
    <section className="panel empty-catalog"><h1>This page couldn’t load</h1>
      <p>Please try again in a moment.</p>
      <button className="shop-button primary" onClick={reset}>Try again</button>
      <Link className="text-link" href="/">Go to the homepage</Link>
    </section>
  </main></>;
}
