"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { Notice, StockStatus } from "@/components/design/commerce-ui";
import { QuantityStepper } from "@/components/design/quantity-stepper";
import { addToCart, DIRECT_KEY, MAX_LINE_QUANTITY, type CartItem } from "@/lib/cart";
import { getPending } from "@/lib/checkout-session";
import { formatCurrency } from "@/lib/format-currency";
import type { Product } from "@/types/product";

export function ProductPurchasePanel({ product }: { product: Product }) {
  const [exchange, setExchange] = useState<CartItem["exchange"]>("without");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const [navigating, startTransition] = useTransition();
  const price = exchange === "with" ? product.withExchangePaise : product.withoutExchangePaise;
  const maxQuantity = Math.min(MAX_LINE_QUANTITY, product.stock);
  const savings = product.withoutExchangePaise - product.withExchangePaise;
  const canPurchase = product.active && maxQuantity > 0 && product.withExchangePaise >= 0 && savings >= 0;

  function choose(direct: boolean) {
    setError("");
    setMessage("");
    if (!canPurchase || quantity < 1 || quantity > maxQuantity) return;
    try {
      if (direct) {
        if (!getPending("direct")) {
          sessionStorage.setItem(DIRECT_KEY, JSON.stringify([{ productId: product.id, exchange, quantity }]));
        }
        startTransition(() => router.push("/checkout?buy=1"));
      } else {
        addToCart(product.id, exchange, quantity, product.stock);
        setMessage("Added to your cart.");
      }
    } catch (error) {
      setError(error instanceof Error && error.name === "Error" ? error.message : "Unable to save your selection in this browser.");
    }
  }

  return (
    <section className="purchase-panel" aria-labelledby="purchase-title">
      <div className="flex flex-wrap justify-between gap-2">
        <h2 id="purchase-title">Price and availability</h2><StockStatus available={canPurchase} />
      </div>
      <div><p className="purchase-price">{formatCurrency(price * quantity)}</p>
        <p className="purchase-price-meta">GST included · MRP {formatCurrency(product.mrpPaise)} per battery</p>
      </div>
      <fieldset className="exchange-options">
        <legend className="field-label">Old battery exchange</legend>
        {(["with", "without"] as const).map((option) => <label className="exchange-option" key={option}>
          <input type="radio" name="exchange" checked={exchange === option} onChange={() => setExchange(option)} />
          <span>{option === "with" ? "With exchange" : "Without exchange"}</span><Check size={16} aria-hidden="true" />
          <strong>{formatCurrency(option === "with" ? product.withExchangePaise : product.withoutExchangePaise)}</strong>
        </label>)}
      </fieldset>
      <p className="muted">{savings > 0 ? "Save " + formatCurrency(savings) + " per eligible old battery. " : ""}Our team verifies each old battery at delivery. The without-exchange price applies for each battery that does not qualify.</p>
      {canPurchase && <>
        <QuantityStepper value={quantity} max={maxQuantity} onChange={setQuantity} />
        <div className="purchase-actions">
          <button className="shop-button primary" type="button" disabled={navigating} onClick={() => choose(true)}>{navigating ? "Opening checkout…" : "Buy now"}</button>
          <button className="shop-button" type="button" disabled={navigating} onClick={() => choose(false)}>Add to cart</button>
        </div>
      </>}
      {message && <Notice tone="success">{message} <Link className="text-link" href="/cart">View cart</Link></Notice>}
      {error && <Notice tone="critical">{error}</Notice>}
    </section>
  );
}
