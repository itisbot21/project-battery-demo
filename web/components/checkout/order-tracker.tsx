"use client";

import { useEffect, useRef, useState } from "react";
import { formatCurrency } from "@/lib/format-currency";
import { LoadingPanel, Notice } from "@/components/design/commerce-ui";
import { orderStatusLabel } from "@/lib/order-policy";

type Tracking = {
  id: number; status: string; totalPaise: number; finalTotalPaise: number | null; paid: number; balance: number;
  items: { id: number; brand: string; model: string; quantity: number; exchange: string; originalPaise: number; finalPaise: number | null; approved: number | null }[];
  history: { status: string; createdAt: string }[];
};
const exchangeNotes: Record<string, string> = {
  pending: "Exchange verification pending", approved: "Exchange accepted", rejected: "Exchange declined", partial: "Some exchanges accepted",
};
const checkpoints = [
  { id: "pending", label: "Placed" }, { id: "confirmed", label: "Confirmed" },
  { id: "preparing", label: "Preparing" }, { id: "out_for_delivery", label: "On the way" },
  { id: "delivered", label: "Installed" },
];

function DeliveryProgress({ order }: { order: Tracking }) {
  function matchingIndex(status: string) {
    return status === "completed" ? checkpoints.length - 1 : checkpoints.findIndex((step) => step.id === status);
  }

  const active = matchingIndex(order.status);
  const reached = active >= 0 ? active : Math.max(-1, ...order.history.map((event) => matchingIndex(event.status)));
  return <ol className="tracking-progress" aria-label="Delivery progress">{checkpoints.map((step, index) =>
    <li key={step.id} data-reached={index <= reached} aria-current={index === active ? "step" : undefined}>
      <span aria-hidden="true" />{step.label}
    </li>
  )}</ol>;
}

const date = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

export function OrderTracker() {
  const [token, setToken] = useState("");
  const [order, setOrder] = useState<Tracking>();
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const request = useRef<AbortController | null>(null);

  async function track(code: string) {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setOrder(undefined);
    setStatus("");
    setLoading(true);
    try {
      const response = await fetch("/api/order-tracking", {
        method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: code }),
      });
      const data = await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok) throw new Error(data.error ?? "Unable to track your order.");
      setOrder(data);
    } catch (error) {
      if (!controller.signal.aborted) setStatus(error instanceof Error ? error.message : "Unable to track your order.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    function selectLink() {
      const code = location.hash.slice(1);
      if (!active || !/^[a-f0-9]{64}$/.test(code)) return;
      setToken(code);
      void track(code);
    }
    queueMicrotask(selectLink);
    window.addEventListener("hashchange", selectLink);
    return () => { active = false; window.removeEventListener("hashchange", selectLink); request.current?.abort(); };
  }, []);

  return <div className="grid max-w-3xl gap-3">
    <section className="panel operations-card">
      <form onSubmit={(event) => { event.preventDefault(); void track(token.trim()); }}>
        <label>Private tracking code<input className="store-input" value={token}
          onChange={(event) => setToken(event.target.value)} required maxLength={64} autoComplete="off" spellCheck={false} /></label>
        <button className="shop-button primary" disabled={loading}>{loading ? "Checking…" : "Track order"}</button>
      </form>
      {status && <Notice tone="critical">{status}</Notice>}
    </section>
    {loading && <LoadingPanel label="Looking up your order…" />}
    {order && <section className="panel operations-card" aria-labelledby="tracking-status">
      <p className="eyebrow">Order PB-{order.id}</p>
      <h2 id="tracking-status">{orderStatusLabel(order.status)}</h2>
      <DeliveryProgress order={order} />
      {order.status === "pending" && <p>Our team will call you to confirm delivery timing.</p>}
      {order.items.map((item) => <div key={item.id} className="checkout-line">
        <strong>{item.quantity} × {item.brand} {item.model}</strong>
        <p>{formatCurrency(item.finalPaise ?? item.originalPaise)}
          {item.exchange !== "not_applicable" && " · " + (exchangeNotes[item.exchange] ?? "Exchange under review")}
          {item.approved !== null && item.quantity > 1 && " (" + item.approved + " of " + item.quantity + " accepted)"}</p>
      </div>)}
      <p>Original estimate <strong>{formatCurrency(order.totalPaise)}</strong></p>
      {(order.finalTotalPaise ?? order.totalPaise) !== order.totalPaise && <p>Adjusted total <strong>{formatCurrency(order.finalTotalPaise ?? order.totalPaise)}</strong></p>}
      <dl className="spec-list"><div><dt>Cash collected</dt><dd className="price">{formatCurrency(order.paid)}</dd></div>
        <div><dt>Balance due</dt><dd className="price"><strong>{formatCurrency(order.balance)}</strong></dd></div></dl>
      {order.history.length > 0 && <ol className="tracking-timeline" aria-label="Order history">{order.history.map((event, index) =>
        <li key={index}><span>{orderStatusLabel(event.status)}</span><time dateTime={event.createdAt}>{date.format(new Date(event.createdAt))}</time></li>)}</ol>}
    </section>}
  </div>;
}
