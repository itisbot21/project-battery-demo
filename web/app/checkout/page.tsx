import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingPanel } from "@/components/design/commerce-ui";
import { Checkout } from "@/components/checkout/checkout";
import { LEGACY_DIRECT_ATTEMPT } from "@/lib/direct-checkout";
import { StorefrontNav } from "@/components/layout/storefront-nav";
import { StorefrontFooter } from "@/components/layout/storefront-footer";

export const metadata: Metadata = { title: "Checkout | Project Battery", robots: { index: false, follow: false } };

async function CheckoutContent({ searchParams }: PageProps<"/checkout">) {
  const query = await searchParams;
  if (query.buy !== "1") return <Checkout key="cart" />;
  const recoveryOnly = query.recover === "1";
  const attemptId = typeof query.attempt === "string" ? query.attempt : LEGACY_DIRECT_ATTEMPT;
  return <Checkout key={recoveryOnly ? "history" : "direct-" + attemptId} attemptId={attemptId} recoveryOnly={recoveryOnly} />;
}

export default function CheckoutPage({ searchParams, params }: PageProps<"/checkout">) {
  return <><StorefrontNav /><main className="store-container store-section" id="main-content" tabIndex={-1}>
    <Suspense fallback={<LoadingPanel label="Preparing checkout…" />}>
      <CheckoutContent searchParams={searchParams} params={params} />
    </Suspense>
  </main><StorefrontFooter /></>;
}
