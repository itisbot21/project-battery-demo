import type { ReactNode } from "react";
import Link from "next/link";
import { StorefrontNav } from "./storefront-nav";
import { StorefrontFooter } from "./storefront-footer";

const help = [
  ["/contact", "Contact support"], ["/delivery", "Delivery & installation"], ["/exchange", "Old battery exchange"],
  ["/warranty", "Battery warranty"], ["/returns", "Returns & cancellations"], ["/faq", "FAQs"],
];

export function InfoPage({ title, children }: { title: string; children: ReactNode }) {
  return <><StorefrontNav /><main className="store-container store-section" id="main-content" tabIndex={-1}>
    <header className="info-header"><h1>{title}</h1></header>
    <div className="info-layout">
      <article className="info-content">{children}</article>
      <nav className="panel info-jump" aria-label="Customer help">
        <p className="field-label">Customer help</p>
        {help.map(([url, label]) => <Link key={url} href={url}>{label}</Link>)}
      </nav>
    </div>
  </main><StorefrontFooter /></>;
}
