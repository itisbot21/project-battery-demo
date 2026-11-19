import { getDirectPurchase, readSaved, type CartItem } from "@/lib/cart";
import { createCheckoutToken, pendingKey, type PendingOrder } from "@/lib/checkout-session";

export const LEGACY_DIRECT_ATTEMPT = "legacy";
export const directRecoveryHref = "/checkout?buy=1&recover=1";

const ATTEMPTS_KEY = "project-battery-direct-attempts";

export type DirectAttempt = { id: string; item: CartItem | null; label?: string; token?: string };

export function directAttemptHref(id: string) {
  return "/checkout?buy=1&attempt=" + encodeURIComponent(id);
}

export function listDirectAttempts(storage: Storage = sessionStorage): DirectAttempt[] {
  const attempts = readSaved<DirectAttempt[]>(storage, ATTEMPTS_KEY);
  if (Array.isArray(attempts)) return attempts;

  const item = getDirectPurchase(storage)[0] ?? null;
  const token = readSaved<PendingOrder>(storage, pendingKey("direct"))?.token;
  const legacy = item || token ? [{ id: LEGACY_DIRECT_ATTEMPT, item, token }] : [];
  storage.setItem(ATTEMPTS_KEY, JSON.stringify(legacy));
  return legacy;
}

function sameSelection(previous: CartItem | null, next: CartItem) {
  return previous?.productId === next.productId && previous.quantity === next.quantity &&
    previous.exchange === next.exchange;
}

export function stageDirectPurchase(item: CartItem, label: string, storage: Storage = sessionStorage) {
  const attempts = listDirectAttempts(storage);
  const existing = attempts.find((attempt) => sameSelection(attempt.item, item));
  if (existing) return existing.id;

  const attempt = { id: crypto.randomUUID(), item, label };
  storage.setItem(ATTEMPTS_KEY, JSON.stringify([...attempts, attempt]));
  return attempt.id;
}

export function beginDirectSubmission(id: string, item: CartItem, storage: Storage = sessionStorage): PendingOrder {
  const attempts = listDirectAttempts(storage);
  const attempt = attempts.find((candidate) => candidate.id === id);
  if (!attempt || !sameSelection(attempt.item, item)) throw new Error("The selected battery changed. Reopen Buy Now.");
  if (attempt.token) return { token: attempt.token };

  attempt.token = createCheckoutToken();
  storage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
  return { token: attempt.token };
}

export function finishDirectAttempt(id: string, token: string, storage: Storage = sessionStorage) {
  const attempts = listDirectAttempts(storage).filter((attempt) => attempt.id !== id || attempt.token !== token);
  storage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
}

export function describeDirectAttempt({ item, label }: DirectAttempt) {
  if (!item) return "Earlier Buy Now order";
  const name = label ?? "Battery #" + item.productId;
  return name + " · " + item.quantity + (item.quantity === 1 ? " battery" : " batteries") +
    (item.exchange === "with" ? " · with exchange" : " · without exchange");
}
