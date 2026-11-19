import type { Metadata } from "next";
import { OrderTracker } from "@/components/checkout/order-tracker";
import { StorefrontNav } from "@/components/layout/storefront-nav";
import { StorefrontFooter } from "@/components/layout/storefront-footer";

export const metadata: Metadata = { title: "Track your order | Project Battery", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default function TrackOrderPage() {
  return <><StorefrontNav /><main className="store-container store-section" id="main-content" tabIndex={-1}>
    <div className="page-intro catalog-hero"><h1>Track your order</h1><p>Open the private tracking link from checkout, or enter your tracking code.</p></div>
    <OrderTracker />
  </main><StorefrontFooter /></>;
}
