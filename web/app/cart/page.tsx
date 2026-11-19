"use client";

import Link from "next/link";
import { ShoppingBag, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { StorefrontNav } from "@/components/layout/storefront-nav";
import { StorefrontFooter } from "@/components/layout/storefront-footer";
import { CheckoutSteps, LoadingPanel, Notice } from "@/components/design/commerce-ui";
import { ChoiceSelect } from "@/components/design/choice-field";
import { QuantityStepper } from "@/components/design/quantity-stepper";
import { BatteryImage } from "@/components/products/battery-image";
import { CART_KEY, getCart, lineKey, updateCartQuantity, removeFromCart, changeCartExchange, type CartItem } from "@/lib/cart";
import { fetchCartProducts, priceCart } from "@/lib/cart-prices";
import { formatCurrency } from "@/lib/format-currency";
import type { Product } from "@/types/product";

const exchanges = [{ value: "with", label: "With exchange" }, { value: "without", label: "Without exchange" }];

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [error, setError] = useState("");
  const [lineError, setLineError] = useState("");

  useEffect(() => {
    let request: AbortController | undefined;
    let active = true;
    function load() {
      request?.abort();
      const controller = new AbortController();
      request = controller;
      const saved = getCart();
      setItems(saved);
      setError("");
      setLoading(true);
      void fetchCartProducts(saved, controller.signal).then((products) => {
        if (!controller.signal.aborted) setCatalog(products);
      }).catch(() => {
        if (!controller.signal.aborted) setError("We couldn’t verify current prices and stock.");
      }).finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    }
    const sync = (event: StorageEvent) => { if (event.key === CART_KEY || event.key === null) load(); };
    window.addEventListener("storage", sync);
    queueMicrotask(() => { if (active && !request) load(); });
    return () => { active = false; window.removeEventListener("storage", sync); request?.abort(); };
  }, [retry]);

  const summary = priceCart(items, catalog);

  function change(item: CartItem, quantity: number) {
    setLineError("");
    try {
      setItems(quantity > 0 ? updateCartQuantity(item.productId, item.exchange, quantity) : removeFromCart(item.productId, item.exchange));
    } catch { setLineError("We couldn’t save the cart in this browser."); }
  }

  function exchange(item: CartItem, value: string) {
    if (value !== "with" && value !== "without") return;
    setLineError("");
    try { setItems(changeCartExchange(item, value)); }
    catch (error) {
      setLineError(error instanceof Error && error.name === "Error" ? error.message : "We couldn’t update your exchange choice.");
    }
  }

  return <><StorefrontNav /><main className="store-container store-section" id="main-content" tabIndex={-1}>
    <CheckoutSteps step="cart" />
    <div className="page-intro"><h1>Shopping cart</h1><Link href="/shop" className="text-link">Continue shopping</Link></div>
    {loading ? <LoadingPanel label="Checking current prices and stock…" /> :
      error ? <section className="panel operations-card"><Notice tone="critical">{error}</Notice><button className="shop-button justify-self-start" onClick={() => setRetry((value) => value + 1)}>Retry</button></section> :
      !items.length ? <section className="empty-catalog"><ShoppingBag size={27} aria-hidden="true" /><h2>Your cart is empty</h2><Link className="shop-button primary" href="/shop">Browse batteries</Link></section> :
      <div className="purchase-layout">
        <div className="grid gap-3">
          {lineError && <Notice tone="critical">{lineError}</Notice>}
          {summary.rows.map(({ item, product, maxQuantity, subtotal, available }) => (
            <article key={lineKey(item)} className="panel cart-row">
              <BatteryImage src={product?.imageUrls[0]} alt="" />
              <div className="cart-row-main">
                <div className="cart-row-title">
                  <h2>{product ? <Link href={"/product/" + encodeURIComponent(product.slug)}>{product.brand} {product.model}</Link> : "Unavailable battery"}</h2>
                  <span className="cart-line-price">{formatCurrency(subtotal)}</span>
                </div>
                {!available && <Notice tone="critical">This battery is unavailable in the requested quantity.</Notice>}
                <div className="cart-row-controls">
                  {maxQuantity > 0 && <QuantityStepper label="Quantity" value={item.quantity} max={maxQuantity} onChange={(value) => change(item, value)} />}
                  <ChoiceSelect label="Old battery exchange" options={exchanges} value={item.exchange} onChange={(value) => exchange(item, value)} disabled={!product} />
                  <button type="button" className="icon-button" aria-label={"Remove " + (product ? product.brand + " " + product.model : "unavailable battery")} onClick={() => change(item, 0)}>
                    <Trash2 size={18} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
        <section className="panel operations-card purchase-summary">
          <h2>Order estimate</h2>
          <p className="total">{formatCurrency(summary.totalPaise)}</p>
          <p className="muted">{summary.totalItems} {summary.totalItems === 1 ? "battery" : "batteries"} · GST included</p>
          <p className="muted">Free delivery and installation for eligible PIN codes.</p>
          {summary.maximumPaise > summary.totalPaise && <p className="field-hint">Up to {formatCurrency(summary.maximumPaise)} if the selected exchanges do not qualify.</p>}
          {summary.valid ? <Link className="shop-button primary" href="/checkout">Proceed to checkout</Link>
            : <Notice tone="critical">Review your items to continue.</Notice>}
        </section>
      </div>}
  </main><StorefrontFooter /></>;
}
