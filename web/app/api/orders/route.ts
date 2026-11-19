import { and, asc, eq, gte, inArray, sql } from "drizzle-orm";
import { deliveryPincodes, orderItems, orders, products } from "@/db/schema";
import { transact } from "@/db/transaction";
import { sellableProducts } from "@/lib/catalog";
import { recordOrderEvent } from "@/lib/order-events";
import { digest, trackingTokenPattern } from "@/lib/order-token";
import { serviceablePin } from "@/lib/serviceability";
import { MAX_ORDER_PAISE, serviceCity } from "@/lib/store-policy";

class OrderError extends Error {
  constructor(message: string, readonly status = 400, readonly code?: string) {
    super(message);
  }
}

type OrderLine = { productId: number; exchange: "with" | "without"; quantity: number; unitPricePaise: number };
const clean = (value: unknown) => typeof value === "string" ? value.trim() : "";

function orderLines(value: unknown) {
  if (!Array.isArray(value) || !value.length || value.length > 20) throw new OrderError("Invalid shopping cart.");
  const grouped = new Map<string, OrderLine>();
  for (const item of value) {
    if (!item || !Number.isSafeInteger(item.productId) || item.productId < 1 || item.productId > 2_147_483_647 ||
      !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 10 ||
      (item.exchange !== "with" && item.exchange !== "without") ||
      !Number.isSafeInteger(item.unitPricePaise) || item.unitPricePaise < 0 || item.unitPricePaise > MAX_ORDER_PAISE) {
      throw new OrderError("Invalid cart item.");
    }
    const key = item.productId + ":" + item.exchange;
    const existing = grouped.get(key);
    if (existing && existing.unitPricePaise !== item.unitPricePaise) throw new OrderError("Invalid cart quote.");
    grouped.set(key, { productId: item.productId, exchange: item.exchange,
      quantity: (existing?.quantity ?? 0) + item.quantity, unitPricePaise: item.unitPricePaise });
  }
  const lines = [...grouped.values()].sort((a, b) => a.productId - b.productId || a.exchange.localeCompare(b.exchange));
  if (lines.some((line) => line.quantity > 10) || lines.reduce((sum, line) => sum + line.quantity, 0) > 30) {
    throw new OrderError("Cart quantity limit exceeded.");
  }
  return lines;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  try {
    const token = clean(body?.token);
    const name = clean(body?.customer?.name);
    const phone = clean(body?.customer?.phone);
    const address = clean(body?.customer?.address);
    const pin = clean(body?.customer?.pin);

    if (!trackingTokenPattern.test(token) || name.length < 2 || name.length > 100 ||
      !/^[6-9]\d{9}$/.test(phone) || address.length < 8 || address.length > 500 || !/^[1-9]\d{5}$/.test(pin)) {
      throw new OrderError("Check your customer and delivery details.");
    }
    if (body.paymentMethod !== "cod") throw new OrderError("Only Cash on Delivery is available.");
    const lines = orderLines(body.items);
    const tokenHash = digest(token);
    const requestHash = digest(JSON.stringify([name, phone, address, pin,
      lines.map(({ productId, exchange, quantity }) => [productId, exchange, quantity])]));
    const quantities = new Map<number, number>();
    for (const line of lines) quantities.set(line.productId, (quantities.get(line.productId) ?? 0) + line.quantity);

    const result = await transact(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${tokenHash}, 0))`);
      const [existing] = await tx.select({ id: orders.id, totalPaise: orders.totalPaise, requestHash: orders.requestHash })
        .from(orders).where(eq(orders.trackingTokenHash, tokenHash));
      if (existing) {
        if (existing.requestHash !== requestHash) {
          throw new OrderError("An order was already placed using this checkout. Open its confirmation to review it.", 409, "ALREADY_PLACED");
        }
        return { orderId: existing.id, totalPaise: existing.totalPaise, replayed: true };
      }

      const [area] = await tx.select({ city: deliveryPincodes.city }).from(deliveryPincodes)
        .where(serviceablePin(pin)).for("share");
      const city = area && serviceCity(area.city);
      if (!city) throw new OrderError("Delivery is unavailable for this PIN code.", 400, "PIN_UNAVAILABLE");

      const catalog = await tx.select().from(products).where(and(
        sellableProducts, inArray(products.id, [...quantities.keys()]),
      )).orderBy(asc(products.id)).for("update");
      const byId = new Map(catalog.map((product) => [product.id, product]));
      let totalPaise = 0;
      let maxPayablePaise = 0;
      const items = lines.map((line) => {
        const product = byId.get(line.productId);
        if (!product || (quantities.get(product.id) ?? 0) > product.stock) {
          throw new OrderError("A battery is unavailable in the requested quantity. Review your selection.", 409, "STOCK_CHANGED");
        }
        const exchangeSelected = line.exchange === "with";
        const unitPricePaise = exchangeSelected ? product.withExchangePaise : product.withoutExchangePaise;
        if (product.withExchangePaise < 0 || product.withoutExchangePaise < product.withExchangePaise) {
          throw new OrderError("A battery has invalid pricing. Please contact support.", 409);
        }
        if (unitPricePaise !== line.unitPricePaise) {
          throw new OrderError("A battery price changed. Please review the updated total and place your order again.", 409, "PRICE_CHANGED");
        }
        const lineTotalPaise = unitPricePaise * line.quantity;
        totalPaise += lineTotalPaise;
        maxPayablePaise += product.withoutExchangePaise * line.quantity;
        return {
          productId: product.id, productBrand: product.brand, productModel: product.model,
          quantity: line.quantity, exchangeSelected, exchangeStatus: exchangeSelected ? "pending" : "not_applicable",
          unitPricePaise, withoutExchangeUnitPricePaise: product.withoutExchangePaise,
          withExchangeUnitPricePaise: product.withExchangePaise, lineTotalPaise, finalLineTotalPaise: lineTotalPaise,
        };
      });
      if (totalPaise <= 0 || maxPayablePaise > MAX_ORDER_PAISE) throw new OrderError("Order total is outside the supported range.");

      for (const [id, quantity] of quantities) {
        const updated = await tx.update(products).set({ stock: sql`${products.stock} - ${quantity}` })
          .where(and(eq(products.id, id), sellableProducts, gte(products.stock, quantity))).returning({ id: products.id });
        if (!updated.length) throw new OrderError("Stock changed. Please review your selection.", 409, "STOCK_CHANGED");
      }

      const [order] = await tx.insert(orders).values({
        customerName: name, mobile: phone, address, city, pinCode: pin,
        paymentMethod: "cod", paymentStatus: "pending", orderStatus: "pending",
        totalPaise, finalTotalPaise: totalPaise, balanceDuePaise: totalPaise,
        trackingTokenHash: tokenHash, requestHash,
      }).returning({ id: orders.id });
      await tx.insert(orderItems).values(items.map((item) => ({ ...item, orderId: order.id })));
      await recordOrderEvent(tx, { orderId: order.id, kind: "placed", details: { status: "pending", totalPaise } }, true);
      return { orderId: order.id, totalPaise, replayed: false };
    });

    const purchased = lines.map(({ productId, exchange, quantity }) => ({ productId, exchange, quantity }));
    return Response.json({ success: true, ...result, purchased }, { status: result.replayed ? 200 : 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof OrderError) return Response.json({ error: error.message, code: error.code }, { status: error.status });
    return Response.json({ error: "We couldn’t confirm your order. Retry from this checkout to recover it safely." }, { status: 503 });
  }
}
