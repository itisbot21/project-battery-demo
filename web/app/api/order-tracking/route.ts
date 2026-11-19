import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orderEvents, orderItems, orders } from "@/db/schema";
import { digest, trackingTokenPattern } from "@/lib/order-token";

const headers = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" };

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  if (!trackingTokenPattern.test(token)) {
    return Response.json({ error: "Enter a valid order tracking code." }, { status: 400, headers });
  }

  try {
    const [order] = await db.select({
      id: orders.id, status: orders.orderStatus, totalPaise: orders.totalPaise,
      finalTotalPaise: orders.finalTotalPaise, balance: orders.balanceDuePaise, paid: orders.paidPaise,
    }).from(orders).where(eq(orders.trackingTokenHash, digest(token)));
    if (!order) return Response.json({ error: "No order was found for this code." }, { status: 404, headers });
    if (body?.confirmationOnly === true) {
      const lines = await db.select({ productId: orderItems.productId, selected: orderItems.exchangeSelected, quantity: orderItems.quantity })
        .from(orderItems).where(eq(orderItems.orderId, order.id));
      const purchased = lines.map(({ productId, selected, quantity }) => ({ productId, exchange: selected ? "with" : "without", quantity }));
      return Response.json({ id: order.id, totalPaise: order.totalPaise, purchased }, { headers });
    }

    const [items, events] = await Promise.all([
      db.select({
        id: orderItems.id, brand: orderItems.productBrand, model: orderItems.productModel,
        quantity: orderItems.quantity, exchange: orderItems.exchangeStatus,
        originalPaise: orderItems.lineTotalPaise, finalPaise: orderItems.finalLineTotalPaise,
        approved: orderItems.approvedExchangeQuantity,
      }).from(orderItems).where(eq(orderItems.orderId, order.id)).orderBy(asc(orderItems.id)),
      db.select({ kind: orderEvents.kind, details: orderEvents.details, createdAt: orderEvents.createdAt })
        .from(orderEvents).where(eq(orderEvents.orderId, order.id)).orderBy(asc(orderEvents.id)),
    ]);

    return Response.json({ ...order, items, history: events.flatMap(({ kind, details, createdAt }) =>
      (kind === "placed" || kind === "status") && typeof details.status === "string" ? [{ status: details.status, createdAt }] : []),
    }, { headers });
  } catch {
    return Response.json({ error: "Tracking is temporarily unavailable. Please try again." }, { status: 503, headers });
  }
}
