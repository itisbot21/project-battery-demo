export type CartItem = { productId: number; exchange: "with" | "without"; quantity: number };

export const CART_KEY = "project-battery-cart";
const CART_CHANGED = "project-battery-cart-changed";
export const DIRECT_KEY = "project-battery-direct";
export const MAX_LINES = 20;
export const MAX_UNITS = 30;
export const MAX_LINE_QUANTITY = 10;
export const lineKey = (item: CartItem) => item.productId + ":" + item.exchange;

function cleanCart(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  const grouped = new Map<string, CartItem>();
  for (const item of value) {
    if (!item || !Number.isSafeInteger(item.productId) || item.productId < 1 || item.productId > 2_147_483_647 ||
      (item.exchange !== "with" && item.exchange !== "without") ||
      !Number.isSafeInteger(item.quantity) || item.quantity < 1) continue;
    const line: CartItem = { productId: item.productId, exchange: item.exchange, quantity: item.quantity };
    const key = lineKey(line);
    line.quantity = Math.min(MAX_LINE_QUANTITY, line.quantity + (grouped.get(key)?.quantity ?? 0));
    grouped.set(key, line);
  }
  return [...grouped.values()].slice(0, MAX_LINES);
}

export function readSaved<T>(storage: Storage, key: string): T | null {
  try { return JSON.parse(storage.getItem(key) ?? "null") as T | null; } catch { return null; }
}

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try { return cleanCart(readSaved(localStorage, CART_KEY)); } catch { return []; }
}

export function getDirectPurchase() {
  return cleanCart(readSaved(sessionStorage, DIRECT_KEY)).slice(0, 1);
}

export function getCartCount() {
  return getCart().reduce((total, line) => total + line.quantity, 0);
}

export function subscribeToCart(listener: () => void) {
  function sync(event: StorageEvent) {
    if (event.key === CART_KEY || event.key === null) listener();
  }
  window.addEventListener(CART_CHANGED, listener);
  window.addEventListener("storage", sync);
  return () => {
    window.removeEventListener(CART_CHANGED, listener);
    window.removeEventListener("storage", sync);
  };
}

function saveCart(cart: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event(CART_CHANGED));
}

export function changeCartExchange(item: CartItem, exchange: CartItem["exchange"]) {
  const cart = getCart();
  const current = cart.find((line) => lineKey(line) === lineKey(item));
  if (!current || current.exchange === exchange) return cart;

  const destination = cart.find((line) => line.productId === current.productId && line.exchange === exchange);
  if ((destination?.quantity ?? 0) + current.quantity > MAX_LINE_QUANTITY) {
    throw new Error("Choose a smaller quantity before combining these exchange options.");
  }

  const updated = cart.flatMap((line) => {
    if (line === destination) return [{ ...line, quantity: line.quantity + current.quantity }];
    if (line !== current) return [line];
    return destination ? [] : [{ ...line, exchange }];
  });
  saveCart(updated);
  return updated;
}

export function addToCart(productId: number, exchange: CartItem["exchange"], quantity = 1, stock = MAX_UNITS) {
  const cart = getCart();
  const key = lineKey({ productId, exchange, quantity });
  const existing = cart.find((item) => lineKey(item) === key);
  const requested = cart.filter((item) => item.productId === productId).reduce((sum, item) => sum + item.quantity, 0);
  if (requested + quantity > stock) throw new Error("Your cart already includes this battery. Reduce the quantity to match available stock.");
  if ((existing?.quantity ?? 0) + quantity > MAX_LINE_QUANTITY ||
      cart.reduce((sum, item) => sum + item.quantity, 0) + quantity > MAX_UNITS ||
      (!existing && cart.length >= MAX_LINES)) throw new Error("This selection exceeds the cart quantity limit.");
  if (existing) existing.quantity += quantity;
  else cart.push({ productId, exchange, quantity });
  saveCart(cart);
}

export function updateCartQuantity(productId: number, exchange: CartItem["exchange"], quantity: number) {
  const cart = getCart().map((item) => item.productId === productId && item.exchange === exchange
    ? { ...item, quantity: Math.max(0, Math.min(MAX_LINE_QUANTITY, quantity)) } : item).filter((item) => item.quantity > 0);
  saveCart(cart);
  return cart;
}

export function removeFromCart(productId: number, exchange: CartItem["exchange"]) {
  return updateCartQuantity(productId, exchange, 0);
}

export function removePurchased(purchased: CartItem[]) {
  const quantities = new Map(purchased.map((item) => [lineKey(item), item.quantity]));
  saveCart(getCart().map((item) => ({ ...item, quantity: item.quantity - (quantities.get(lineKey(item)) ?? 0) }))
    .filter((item) => item.quantity > 0));
}
