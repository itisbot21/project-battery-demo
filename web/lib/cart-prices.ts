import { MAX_LINE_QUANTITY, MAX_UNITS, type CartItem } from "@/lib/cart";
import { MAX_ORDER_PAISE } from "@/lib/store-policy";
import type { Product } from "@/types/product";

export type PricedLine = ReturnType<typeof priceCart>["rows"][number];

export async function fetchCartProducts(items: CartItem[], signal?: AbortSignal): Promise<Product[]> {
  const ids = [...new Set(items.map(({ productId }) => productId))];
  if (!ids.length) return [];
  const response = await fetch("/api/products?ids=" + ids.join(","), { cache: "no-store", signal });
  if (!response.ok) throw new Error("We couldn’t load the latest prices and stock.");
  return response.json();
}

export function priceCart(items: CartItem[], catalog: Product[]) {
  const byId = new Map(catalog.map((product) => [product.id, product]));
  const quantities = new Map<number, number>();
  for (const item of items) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  const totalItems = items.reduce((sum, row) => sum + row.quantity, 0);
  const rows = items.map((item) => {
    const product = byId.get(item.productId);
    const currentStock = product && product.active ? product.stock : 0;
    const requested = quantities.get(item.productId) ?? 0;
    const maxQuantity = Math.max(0, Math.min(MAX_LINE_QUANTITY, currentStock - requested + item.quantity,
      MAX_UNITS - totalItems + item.quantity));
    const unitPricePaise = !product ? 0 : item.exchange === "with" ? product.withExchangePaise : product.withoutExchangePaise;
    return { item, product, unitPricePaise, maxQuantity,
      subtotal: unitPricePaise * item.quantity,
      withoutExchangeSubtotal: (product?.withoutExchangePaise ?? 0) * item.quantity,
      available: Boolean(product?.active && requested <= currentStock && product.withExchangePaise >= 0 &&
        product.withoutExchangePaise >= product.withExchangePaise),
    };
  });
  const totalPaise = rows.reduce((sum, row) => sum + row.subtotal, 0);
  const maximumPaise = rows.reduce((sum, row) => sum + row.withoutExchangeSubtotal, 0);
  return { rows, totalItems, totalPaise, maximumPaise, valid: rows.length > 0 && rows.every((row) => row.available) &&
    totalItems <= MAX_UNITS && totalPaise > 0 && maximumPaise <= MAX_ORDER_PAISE };
}
