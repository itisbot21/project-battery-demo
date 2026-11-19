import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingPanel } from "@/components/design/commerce-ui";
import { Checkout } from "@/components/checkout/checkout";
import { StorefrontNav } from "@/components/layout/storefront-nav";
import { StorefrontFooter } from "@/components/layout/storefront-footer";

export const metadata: Metadata = { title: "Checkout | Project Battery", robots: { index: false, follow: false } };

async function CheckoutContent({ searchParams }: PageProps<"/checkout">) {
  const mode = (await searchParams).buy === "1" ? "direct" : "cart";
  return <Checkout key={mode} mode={mode} />;
}

export default function CheckoutPage({ searchParams, params }: PageProps<"/checkout">) {
  return <><StorefrontNav /><main className="store-container store-section" id="main-content" tabIndex={-1}>
    <Suspense fallback={<LoadingPanel label="Preparing checkout…" />}>
      <CheckoutContent searchParams={searchParams} params={params} />
    </Suspense>
  </main><StorefrontFooter /></>;
}
