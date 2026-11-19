import type { Metadata } from "next";
import { StorefrontNav } from "@/components/layout/storefront-nav";
import { StorefrontFooter } from "@/components/layout/storefront-footer";
import { OrderReceipt } from "@/components/checkout/order-receipt";

export const metadata: Metadata = { title: "Order confirmation | Project Battery", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default function OrderConfirmationPage() {
  return <><StorefrontNav /><main className="store-container store-section" id="main-content" tabIndex={-1}><OrderReceipt /></main><StorefrontFooter /></>;
}
