"use client";

import Link from "next/link";
import { Check, Copy } from "lucide-react";
import { CheckoutSteps, LoadingPanel, Notice } from "@/components/design/commerce-ui";
import { useEffect, useState } from "react";
import { readSaved } from "@/lib/cart";
import { CONFIRMATION_KEY, type Confirmation } from "@/lib/checkout-session";
import { directRecoveryHref, listDirectAttempts } from "@/lib/direct-checkout";
import { formatCurrency } from "@/lib/format-currency";

export function OrderReceipt() {
  const [receipt, setReceipt] = useState<Confirmation | null>();
  const [notice, setNotice] = useState("");
  const [hasEarlier, setHasEarlier] = useState(false);
  useEffect(() => {
    queueMicrotask(() => {
      try { setReceipt(readSaved<Confirmation>(sessionStorage, CONFIRMATION_KEY)); }
      catch { setReceipt(null); }
      try { setHasEarlier(listDirectAttempts().some((attempt) => attempt.token)); }
      catch { setHasEarlier(false); }
    });
  }, []);

  if (receipt === undefined) return <LoadingPanel label="Loading confirmation…" />;
  if (!receipt) return <section className="panel empty-catalog">
    <h1>Order confirmation</h1><p>This browser session has no saved confirmation.</p><Link className="text-link" href="/track-order">Track with a saved code</Link>
  </section>;

  const link = "/track-order#" + receipt.token;
  return <><CheckoutSteps step="complete" /><section className="panel operations-card purchase-summary max-w-2xl">
    <span className="receipt-motif"><Check size={27} aria-hidden="true" /></span><h1>Order placed</h1>
    <p className="eyebrow">Order PB-{receipt.id}</p>
    <div><p className="field-label">Estimated cash-on-delivery total</p><p className="total">{formatCurrency(receipt.totalPaise)}</p></div>
    <p>Our team will call to confirm delivery timing. We’ll check any old battery exchange during installation before collecting payment.</p>
    <p>Save your private tracking link to check this order later.</p>
    <div className="flex flex-wrap gap-2">
      <Link className="shop-button primary" href={link}>Track order</Link>
      <button className="shop-button" onClick={async () => {
        try { await navigator.clipboard.writeText(location.origin + link); setNotice("Tracking link copied."); }
        catch { setNotice("Open Track order and copy the address from your browser."); }
      }}><Copy size={17} aria-hidden="true" /> Copy tracking link</button>
    </div>
    {hasEarlier && <Link className="text-link" href={directRecoveryHref}>Check earlier Buy Now checkouts</Link>}
    {notice && <Notice>{notice}</Notice>}
  </section></>;
}
