
export type CartItem = {
  productId: number;
  exchange: "with" | "without";
  quantity: number;
};

const CART_KEY = "project-battery-cart";

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const saved = JSON.parse(
      localStorage.getItem(CART_KEY) || "[]"
    );

    if (!Array.isArray(saved)) return [];

    return saved.filter(
      (item): item is CartItem =>
        item !== null &&
        typeof item === "object" &&
        Number.isInteger(item.productId) &&
        item.productId > 0 &&
        (item.exchange === "with" ||
          item.exchange === "without") &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0
    );
  } catch {
    return [];
  }
}

function saveCart(cart: CartItem[]) {
  if (typeof window === "undefined") return;

  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function addToCart(
  productId: number,
  exchange: "with" | "without"
) {
  const cart = getCart();

  const existing = cart.find(
    (item) =>
      item.productId === productId &&
      item.exchange === exchange
  );

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      productId,
      exchange,
      quantity: 1,
    });
  }

  saveCart(cart);
}

export function updateCartQuantity(
  productId: number,
  exchange: "with" | "without",
  quantity: number
): CartItem[] {
  const cart = getCart()
    .map((item) =>
      item.productId === productId &&
      item.exchange === exchange
        ? { ...item, quantity }
        : item
    )
    .filter((item) => item.quantity > 0);

  saveCart(cart);
  return cart;
}

export function removeFromCart(
  productId: number,
  exchange: "with" | "without"
): CartItem[] {
  const cart = getCart().filter(
    (item) =>
      !(
        item.productId === productId &&
        item.exchange === exchange
      )
  );

  saveCart(cart);
  return cart;
}
