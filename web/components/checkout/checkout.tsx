"use client";

import Link from "next/link";
import { Banknote, ChevronLeft } from "lucide-react";
import { CheckoutSteps, LoadingPanel, Notice } from "@/components/design/commerce-ui";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { getCart, lineKey, removePurchased, type CartItem } from "@/lib/cart";
import { fetchCartProducts, priceCart } from "@/lib/cart-prices";
import { CONFIRMATION_KEY, getPending, pendingKey, recoverConfirmation, startSubmission,
  type Confirmation } from "@/lib/checkout-session";
import { beginDirectSubmission, describeDirectAttempt, directAttemptHref, finishDirectAttempt, listDirectAttempts,
  type DirectAttempt } from "@/lib/direct-checkout";
import { formatCurrency } from "@/lib/format-currency";
import type { Product } from "@/types/product";

function EarlierCheckouts({ attempts }: { attempts: DirectAttempt[] }) {
  return <section className="panel operations-card checkout-recovery">
    <h2>Earlier Buy Now checkouts</h2>
    <p className="muted">An earlier order may still be processing. Open it to check its status or retry that order safely.</p>
    <ul>{attempts.map((attempt) => <li key={attempt.id}>
      <Link className="text-link" href={directAttemptHref(attempt.id)}>
        Check earlier checkout <span className="block">{describeDirectAttempt(attempt)}</span>
      </Link>
    </li>)}</ul>
  </section>;
}

export function Checkout({ attemptId, recoveryOnly = false }: { attemptId?: string; recoveryOnly?: boolean }) {
  const isDirect = attemptId !== undefined;
  const [current, setCurrent] = useState<DirectAttempt>();
  const [earlier, setEarlier] = useState<DirectAttempt[]>([]);
  const [continueNew, setContinueNew] = useState(false);
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
  const active = useRef(false);
  const contactTitle = useRef<HTMLHeadingElement>(null);
  const summary = priceCart(items, catalog);
  const reviewSelection = Boolean(current?.item && !current.token && earlier.length && !continueNew);

  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);

  useEffect(() => {
    if (continueNew) contactTitle.current?.focus();
  }, [continueNew]);

  const confirm = useCallback((confirmation: Confirmation) => {
    sessionStorage.setItem(CONFIRMATION_KEY, JSON.stringify(confirmation));
    try {
      if (attemptId !== undefined) finishDirectAttempt(attemptId, confirmation.token);
      else {
        sessionStorage.removeItem(pendingKey("cart"));
        removePurchased(confirmation.purchased);
      }
    } catch {
      // The order is already saved. The confirmation can still be shown.
    }
    router.replace("/order-confirmation");
  }, [attemptId, router]);

  useEffect(() => {
    const controller = new AbortController();
    async function refresh() {
      if (controller.signal.aborted) return;
      setLoading(true);
      setLoadingError("");
      try {
        let attempt: DirectAttempt | undefined;
        if (isDirect) {
          const attempts = listDirectAttempts();
          setEarlier(attempts.filter((candidate) => candidate.token && (recoveryOnly || candidate.id !== attemptId)));
          if (recoveryOnly) return;
          attempt = attempts.find((candidate) => candidate.id === attemptId);
          setCurrent(attempt);
        }
        const token = isDirect ? attempt?.token : getPending("cart")?.token;
        if (token) {
          const saved = await recoverConfirmation(token, controller.signal);
          if (controller.signal.aborted) return;
          if (saved) { confirm(saved); return; }
        }
        const selection = isDirect ? (attempt?.item ? [attempt.item] : []) : getCart();
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
  }, [attemptId, confirm, isDirect, recoveryOnly, reload]);

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
    if (!summary.valid || verified?.pin !== pin || submitting.current || loading || loadingError || reviewSelection) return;
    const fields = new FormData(event.currentTarget);
    submitting.current = true;
    setSending(true);
    setError("");
    let accepted = false;
    try {
      const pending = isDirect ? beginDirectSubmission(attemptId, items[0]) : startSubmission("cart");
      const response = await fetch("/api/orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: pending.token, paymentMethod: "cod",
          customer: { name: fields.get("name"), phone: fields.get("phone"), address: fields.get("address"), pin },
          items: summary.rows.map(({ item, unitPricePaise }) => ({ ...item, unitPricePaise })),
        }),
      });
      if (!active.current) return;
      if (response.status === 429) {
        setError("There were too many order attempts. Wait a moment and retry from this checkout.");
        return;
      }
      const result = await response.json();
      if (!active.current) return;
      if (response.ok && result.success === true) {
        confirm({ id: result.orderId, totalPaise: result.totalPaise, token: pending.token, purchased: result.purchased });
        accepted = true;
        return;
      }
      if (result.code === "ALREADY_PLACED") {
        const saved = await recoverConfirmation(pending.token);
        if (!active.current) return;
        if (saved) { confirm(saved); accepted = true; return; }
      }
      if (!isDirect && response.status >= 400 && response.status < 500 && result.code !== "ALREADY_PLACED") {
        sessionStorage.removeItem(pendingKey("cart"));
      }
      if (result.code === "PRICE_CHANGED" || result.code === "STOCK_CHANGED") {
        try { setCatalog(await fetchCartProducts(items)); } catch { setLoadingError("Unable to refresh prices. Please retry."); }
      }
      if (result.code === "PIN_UNAVAILABLE") setVerified(undefined);
      setError(result.error ?? "We couldn’t confirm your order. Retry from this checkout.");
    } catch {
      if (active.current) setError("We couldn’t confirm your order. Retry from this checkout to recover it safely.");
    } finally {
      if (!accepted && active.current) {
        submitting.current = false;
        setSending(false);
      }
    }
  }

  return (
    <>
      <CheckoutSteps step="checkout" />
      <div className="page-intro">
        <h1>{recoveryOnly ? "Recover a Buy Now order" : isDirect ? "Buy now checkout" : "Checkout"}</h1>
        {!recoveryOnly && <p className="muted">{isDirect ? "Review the battery selected on the product page." : "Enter your contact and delivery details."}</p>}
        <Link className="shop-button quiet" href={isDirect ? "/shop" : "/cart"}><ChevronLeft size={17} aria-hidden="true" />{isDirect ? "Browse batteries" : "Back to cart"}</Link>
      </div>
      {!loading && earlier.length > 0 && <EarlierCheckouts attempts={earlier} />}
      {loading ? <LoadingPanel label="Checking your order and current prices…" /> :
      loadingError ? <section className="panel operations-card">
        <Notice tone="critical">{loadingError}</Notice><button className="shop-button justify-self-start" onClick={() => setReload((value) => value + 1)}>Retry</button>
      </section> :
      recoveryOnly ? (earlier.length ? null : <section className="panel empty-catalog"><p>No earlier Buy Now checkouts are saved in this tab.</p></section>) :
      !items.length ? <section className="panel empty-catalog">
        <h2>No batteries selected</h2>
        {current?.token && <p>No order was found yet. If you just placed it, try checking again in a moment.</p>}
        {current?.token ? <button className="shop-button" onClick={() => setReload((value) => value + 1)}>Check again</button>
          : <Link className="shop-button primary" href="/shop">Browse batteries</Link>}
      </section> :
      reviewSelection && current ? <section className="panel operations-card">
        <h2>Your new selection</h2>
        <p><strong>{describeDirectAttempt(current)}</strong></p>
        <p className="muted">Continue to place a separate order for this battery, or check your earlier checkout above.</p>
        <button className="shop-button primary justify-self-start" onClick={() => setContinueNew(true)}>Continue with this battery</button>
      </section> :
      <>
      {current?.token && <div className="checkout-recovery">
        <Notice>We haven’t found a confirmation for this checkout yet. You can retry this same order safely.</Notice>
        <button className="shop-button quiet mt-2" type="button" disabled={sending} onClick={() => setReload((value) => value + 1)}>Check again</button>
      </div>}
      <div className="purchase-layout checkout-layout">
        <section className="panel operations-card">
          <h2 ref={contactTitle} tabIndex={-1}>Contact and delivery</h2>
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
      </div></>}
    </>
  );
}
