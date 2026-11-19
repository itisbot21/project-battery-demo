import type { CartItem } from "@/lib/cart";
import { readSaved } from "@/lib/cart";

export type CheckoutMode = "cart" | "direct";
export type PendingOrder = { token: string };
export type Confirmation = { id: number; totalPaise: number; token: string; purchased: CartItem[] };

export const CONFIRMATION_KEY = "project-battery-confirmation";
export const pendingKey = (mode: CheckoutMode) => "project-battery-pending-" + mode;
export const getPending = (mode: CheckoutMode) => readSaved<PendingOrder>(sessionStorage, pendingKey(mode));

export function startSubmission(mode: CheckoutMode) {
  const existing = getPending(mode);
  const token = existing?.token ?? Array.from(crypto.getRandomValues(new Uint8Array(32)),
    (byte) => byte.toString(16).padStart(2, "0")).join("");
  const pending = { token };
  sessionStorage.setItem(pendingKey(mode), JSON.stringify(pending));
  return pending;
}

export async function recoverConfirmation(token: string, signal?: AbortSignal) {
  const response = await fetch("/api/order-tracking", { method: "POST", signal,
    headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, confirmationOnly: true }) });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Order recovery is temporarily unavailable.");
  const order = await response.json() as Omit<Confirmation, "token">;
  return { ...order, token };
}
