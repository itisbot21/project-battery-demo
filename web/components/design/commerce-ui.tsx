import { CircleAlert, CircleCheck, Info } from "lucide-react";
import type { ReactNode } from "react";

export function Notice({ children, tone = "info" }: { children: ReactNode; tone?: "success" | "critical" | "info" }) {
  const Icon = tone === "success" ? CircleCheck : tone === "critical" ? CircleAlert : Info;
  return <div className={"notice notice-" + tone} role={tone === "critical" ? "alert" : "status"}>
    <Icon size={19} aria-hidden="true" /><div>{children}</div>
  </div>;
}

export function LoadingPanel({ label, cards = false }: { label: string; cards?: boolean }) {
  return <div className={cards ? "loading-panel loading-cards" : "loading-panel"} role="status">
    <p>{label}</p>
    <div aria-hidden="true"><i /><i /><i /></div>
  </div>;
}

export function StockStatus({ available }: { available: boolean }) {
  return <span className="stock-tag" data-stock={available ? "available" : "unavailable"}>{available ? "In stock" : "Out of stock"}</span>;
}

export function CheckoutSteps({ step }: { step: "cart" | "checkout" | "complete" }) {
  const steps = [{ id: "cart", label: "Selection" }, { id: "checkout", label: "Delivery & COD" }, { id: "complete", label: "Confirmation" }];
  const active = steps.findIndex((item) => item.id === step);
  return <ol className="checkout-steps" aria-label="Checkout progress">
    {steps.map((item, index) => <li key={item.id} aria-current={item.id === step ? "step" : undefined} data-done={index < active || undefined}>
      <span aria-hidden="true">{index < active ? <CircleCheck size={16} /> : index + 1}</span>{item.label}
    </li>)}
  </ol>;
}
