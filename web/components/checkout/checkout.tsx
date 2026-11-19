"use client";

import Link from "next/link";
import { Banknote, ChevronLeft } from "lucide-react";
import { CheckoutSteps, LoadingPanel, Notice } from "@/components/design/commerce-ui";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { DIRECT_KEY, getCart, getDirectPurchase, lineKey, removePurchased, type CartItem } from "@/lib/cart";
import { fetchCartProducts, priceCart } from "@/lib/cart-prices";
import { CONFIRMATION_KEY, getPending, pendingKey, recoverConfirmation, startSubmission,
  type CheckoutMode, type Confirmation } from "@/lib/checkout-session";
import { formatCurrency } from "@/lib/format-currency";
import type { Product } from "@/types/product";

export function Checkout({ mode }: { mode: CheckoutMode }) {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState("");
  const [reload, setReload] = useState(0);
  const [pin, setPin] = useState("");
  const [verified, setVerified] = useState<{ pin: string; city: string }>();
  const [pinNote, setPinNote] = useState("");
  const [checkingPin, setCheckingPin] = useState(false);
  const pinRequest = useRef(0);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const submitting = useRef(false);
  const summary = priceCart(items, catalog);

  const confirm = useCallback((confirmation: Confirmation) => {
    sessionStorage.setItem(CONFIRMATION_KEY, JSON.stringify(confirmation));
    sessionStorage.removeItem(pendingKey(mode));
    try {
      if (mode === "direct") sessionStorage.removeItem(DIRECT_KEY);
      else removePurchased(confirmation.purchased);
    } catch {
      // The order is already saved. The confirmation can still be shown.
    }
    router.replace("/order-confirmation");
  }, [mode, router]);

  useEffect(() => {
    const controller = new AbortController();
    async function refresh() {
      if (controller.signal.aborted) return;
      setLoading(true);
      setLoadingError("");
      try {
        const pending = getPending(mode);
        if (pending) {
          const saved = await recoverConfirmation(pending.token, controller.signal);
          if (controller.signal.aborted) return;
          if (saved) { confirm(saved); return; }
        }
        const selection = mode === "direct" ? getDirectPurchase() : getCart();
        const products = await fetchCartProducts(selection, controller.signal);
        if (controller.signal.aborted) return;
        setItems(selection);
        setCatalog(products);
      } catch {
        if (!controller.signal.aborted) setLoadingError("We couldn’t recover checkout or check current prices. Please retry.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    queueMicrotask(() => void refresh());
    return () => controller.abort();
  }, [mode, confirm, reload]);

  async function checkPin() {
    if (!/^[1-9]\d{5}$/.test(pin)) { setPinNote("Enter a valid six-digit PIN code."); return; }
    const id = ++pinRequest.current;
    setCheckingPin(true);
    setVerified(undefined);
    setPinNote("");
    try {
      const response = await fetch("/api/serviceability?pin=" + encodeURIComponent(pin), { cache: "no-store" });
      if (!response.ok) throw new Error();
      const result = await response.json();
      if (id !== pinRequest.current) return;
      if (result.serviceable && typeof result.city === "string") {
        setVerified({ pin, city: result.city });
        setPinNote("Free delivery and installation are available in " + result.city + ".");
      } else {
        setPinNote("We don’t deliver to this PIN code.");
      }
    } catch {
      if (id === pinRequest.current) setPinNote("Couldn’t check delivery. Please try again.");
    } finally {
      if (id === pinRequest.current) setCheckingPin(false);
    }
  }

  async function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!summary.valid || verified?.pin !== pin || submitting.current || loading || loadingError) return;
    const fields = new FormData(event.currentTarget);
    submitting.current = true;
    setSending(true);
    setError("");
    let accepted = false;
    try {
      const pending = startSubmission(mode);
      const response = await fetch("/api/orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: pending.token, paymentMethod: "cod",
          customer: { name: fields.get("name"), phone: fields.get("phone"), address: fields.get("address"), pin },
          items: summary.rows.map(({ item, unitPricePaise }) => ({ ...item, unitPricePaise })),
        }),
      });
      const result = await response.json();
      if (response.ok && result.success === true) {
        confirm({ id: result.orderId, totalPaise: result.totalPaise, token: pending.token, purchased: result.purchased });
        accepted = true;
        return;
      }
      if (result.code === "ALREADY_PLACED") {
        const saved = await recoverConfirmation(pending.token);
        if (saved) { confirm(saved); accepted = true; return; }
      }
      if (response.status >= 400 && response.status < 500 && result.code !== "ALREADY_PLACED") {
        sessionStorage.removeItem(pendingKey(mode));
      }
      if (result.code === "PRICE_CHANGED" || result.code === "STOCK_CHANGED") {
        try { setCatalog(await fetchCartProducts(items)); } catch { setLoadingError("Unable to refresh prices. Please retry."); }
      }
      if (result.code === "PIN_UNAVAILABLE") setVerified(undefined);
      setError(result.error ?? "We couldn’t confirm your order. Retry from this checkout.");
    } catch {
      setError("We couldn’t confirm your order. Retry from this checkout to recover it safely.");
    } finally {
      if (!accepted) {
        submitting.current = false;
        setSending(false);
      }
    }
  }

  return (
    <>
      <CheckoutSteps step="checkout" />
      <div className="page-intro">
        <h1>{mode === "direct" ? "Buy now checkout" : "Checkout"}</h1>
        <p className="muted">{mode === "direct" ? "Review the battery selected on the product page." : "Enter your contact and delivery details."}</p>
        <Link className="shop-button quiet" href={mode === "direct" ? "/shop" : "/cart"}><ChevronLeft size={17} aria-hidden="true" />{mode === "direct" ? "Browse batteries" : "Back to cart"}</Link>
      </div>
      {loading ? <LoadingPanel label="Checking your order and current prices…" /> :
      loadingError ? <section className="panel operations-card">
        <Notice tone="critical">{loadingError}</Notice><button className="shop-button justify-self-start" onClick={() => setReload((value) => value + 1)}>Retry</button>
      </section> :
      !items.length ? <section className="panel empty-catalog">
        <h2>No batteries selected</h2><Link className="shop-button primary" href="/shop">Browse batteries</Link>
      </section> :
      <div className="purchase-layout checkout-layout">
        <section className="panel operations-card">
          <h2>Contact and delivery</h2>
          <form onSubmit={(event) => void placeOrder(event)}>
            <fieldset disabled={sending} className="grid gap-4">
              <label>Full name<input className="store-input" name="name" autoComplete="name" required minLength={2} maxLength={100} /></label>
              <label>Indian mobile number<input className="store-input" name="phone" type="tel" autoComplete="tel-national"
                inputMode="numeric" pattern="[6-9][0-9]{9}" required maxLength={10} /></label>
              <label>Delivery address<textarea className="store-input" name="address" required minLength={8} maxLength={500}
                autoComplete="street-address" placeholder="Flat or house number, building, street and locality" /></label>
              <div className="pin-form">
                <label>Delivery PIN code<input className="store-input" type="text" inputMode="numeric" autoComplete="postal-code" required
                  maxLength={6} pattern="[1-9][0-9]{5}" value={pin} onChange={(event) => {
                    pinRequest.current++;
                    setPin(event.target.value.replace(/\D/g, ""));
                    setVerified(undefined);
                    setPinNote("");
                    setCheckingPin(false);
                  }} /></label>
                <button className="shop-button" type="button" disabled={checkingPin} onClick={() => void checkPin()}>{checkingPin ? "Checking…" : "Check PIN"}</button>
                {pinNote && <div className="pin-result"><Notice tone={verified ? "success" : "critical"}>{pinNote}</Notice></div>}
              </div>
              <div className="checkout-cod"><strong className="flex items-center gap-2"><Banknote size={19} aria-hidden="true" /> Cash on delivery</strong><p>Our team will call to confirm delivery timing. Pay after installation and any exchange check.</p></div>
              {summary.maximumPaise > summary.totalPaise && <p className="field-hint">Each old battery is checked at delivery. If none qualify, the amount payable is {formatCurrency(summary.maximumPaise)}.</p>}
              {error && <Notice tone="critical">{error}</Notice>}
              {!summary.valid && <Notice tone="critical">A battery is unavailable or this selection exceeds the order limits.</Notice>}
              <button className="shop-button primary" disabled={!summary.valid || !verified || checkingPin || sending}>
                {sending ? "Placing order…" : "Place cash-on-delivery order"}
              </button>
            </fieldset>
          </form>
        </section>
        <aside className="panel operations-card purchase-summary" aria-label="Order summary">
          <h2>Order summary</h2>
          {summary.rows.map(({ item, product, subtotal }) => <div key={lineKey(item)} className="checkout-line">
            <p><strong>{product ? product.brand + " " + product.model : "Unavailable battery"}</strong></p>
            <p>{item.quantity} × {item.exchange === "with" ? "with exchange" : "without exchange"} · {formatCurrency(subtotal)}</p>
          </div>)}
          <div><p className="field-label">Estimated total</p><p className="total">{formatCurrency(summary.totalPaise)}</p></div>
          <p className="muted">GST included. Free delivery and installation.</p>
        </aside>
      </div>}
    </>
  );
}
