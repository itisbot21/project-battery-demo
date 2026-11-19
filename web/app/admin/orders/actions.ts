"use server";

import { asc, eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { orderItems, orders, products } from "@/db/schema";
import { transact } from "@/db/transaction";
import { requireAdmin } from "@/lib/require-admin";
import { recordOrderEvent } from "@/lib/order-events";
import { canTransition, exchangeAdjustment, paymentStatus } from "@/lib/order-policy";
import { positiveId } from "@/lib/store-policy";

class InvalidOperation extends Error {}
const formValue = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

export async function manageOrder(form: FormData) {
  const session = await requireAdmin();
  const id = positiveId(formValue(form, "orderId"));
  if (!id) redirect("/admin/orders");
  const path = "/admin/orders/" + id;
  const operation = formValue(form, "operation");
  const reason = formValue(form, "reason");
  let error: string | undefined;
  try {
    if (reason.length > 500) throw new InvalidOperation("Use 500 characters or fewer.");
    await transact(async (tx) => {
      const [order] = await tx.select().from(orders).where(eq(orders.id, id)).for("update");
      if (!order) throw new InvalidOperation("Order not found.");
      const baseEvent = { orderId: id, actorId: session.user.id };
      const currentTotal = order.finalTotalPaise ?? order.totalPaise;
      const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, id)).orderBy(asc(orderItems.id));
      const unsettled = items.some((item) => item.exchangeSelected && item.exchangeStatus === "pending");

      if (operation === "note") {
        if (!reason) throw new InvalidOperation("Enter an order note.");
        await recordOrderEvent(tx, { ...baseEvent, kind: "note", details: { note: reason } });
        return;
      }

      if (operation === "status") {
        const status = formValue(form, "status");
        if (!canTransition(order.orderStatus, status)) throw new InvalidOperation("This status is no longer available.");
        if ((status === "cancelled" || status === "failed_delivery") && !reason) {
          throw new InvalidOperation("Enter a reason for the cancellation or failed delivery.");
        }
        if (status === "delivered" && (unsettled || order.balanceDuePaise !== 0 || order.paymentStatus !== "paid")) {
          throw new InvalidOperation("Resolve exchange and record the full cash collection before confirming installation.");
        }
        if (status === "completed" && order.balanceDuePaise !== 0) throw new InvalidOperation("Settle the balance before completing the order.");
        if (status === "cancelled") {
          if (order.paidPaise > 0) throw new InvalidOperation("Resolve the recorded cash with the business owner before cancellation.");
          if (order.stockRestoredAt) throw new InvalidOperation("Stock for this order has already been restored.");
          const quantities = new Map<number, number>();
          for (const item of items) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
          for (const [productId, quantity] of [...quantities].sort(([left], [right]) => left - right)) {
            await tx.update(products).set({ stock: sql`${products.stock} + ${quantity}` }).where(eq(products.id, productId));
          }
          await tx.update(orders).set({ orderStatus: status, paymentStatus: "cancelled", balanceDuePaise: 0, stockRestoredAt: new Date() })
            .where(eq(orders.id, id));
          await recordOrderEvent(tx, { ...baseEvent, kind: "stock_restored",
            details: { units: items.reduce((sum, item) => sum + item.quantity, 0) } });
        } else {
          await tx.update(orders).set({ orderStatus: status }).where(eq(orders.id, id));
        }
        await recordOrderEvent(tx, { ...baseEvent, kind: "status", details: {
          from: order.orderStatus, status, reason: reason || null,
        } }, true);
        return;
      }

      if (order.paymentMethod !== "cod" || order.orderStatus !== "out_for_delivery") {
        throw new InvalidOperation("Exchange and cash can be recorded for COD orders that are out for delivery.");
      }

      if (operation === "exchange") {
        const item = items.find((line) => line.id === positiveId(formValue(form, "itemId")));
        const input = formValue(form, "approved");
        const approved = /^\d{1,10}$/.test(input) ? Number(input) : -1;
        if (!item || !item.exchangeSelected || item.exchangeStatus !== "pending" || approved < 0 || approved > item.quantity) {
          throw new InvalidOperation("This exchange is already resolved or the accepted quantity is invalid.");
        }
        if (approved < item.quantity && !reason) throw new InvalidOperation("Enter a reason for any declined exchange.");
        const withPrice = item.withExchangeUnitPricePaise ?? item.unitPricePaise;
        const adjustment = exchangeAdjustment(item.quantity, approved, withPrice, item.withoutExchangeUnitPricePaise);
        const finalTotalPaise = currentTotal + adjustment.difference;
        if (finalTotalPaise > 2_147_483_647 || adjustment.lineTotal > 2_147_483_647) {
          throw new InvalidOperation("The revised amount exceeds the supported range.");
        }
        const balance = finalTotalPaise - order.paidPaise;
        await tx.update(orderItems).set({ exchangeStatus: adjustment.status, finalLineTotalPaise: adjustment.lineTotal,
          approvedExchangeQuantity: approved, withExchangeUnitPricePaise: withPrice,
        }).where(eq(orderItems.id, item.id));
        await tx.update(orders).set({ finalTotalPaise, balanceDuePaise: balance, paymentStatus: paymentStatus(order.paidPaise, balance) })
          .where(eq(orders.id, id));
        await recordOrderEvent(tx, { ...baseEvent, kind: "exchange", details: {
          itemId: item.id, approved, rejected: item.quantity - approved, fromPaise: currentTotal,
          toPaise: finalTotalPaise, adjustmentPaise: adjustment.difference, reason: reason || null,
        } });
        return;
      }

      if (operation === "cash") {
        if (unsettled) throw new InvalidOperation("Verify all exchanges before recording cash.");
        const raw = formValue(form, "amount");
        const expected = formValue(form, "expectedPaidPaise");
        if (expected !== String(order.paidPaise)) throw new InvalidOperation("The cash balance changed. Review the latest amount before continuing.");
        if (!/^\d{1,8}(\.\d{1,2})?$/.test(raw)) throw new InvalidOperation("Enter a valid rupee amount.");
        const [whole, fraction = ""] = raw.split(".");
        const amount = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
        if (amount < 1 || amount > order.balanceDuePaise) throw new InvalidOperation("Cash collected must be within the outstanding balance.");
        const paid = order.paidPaise + amount;
        const balance = currentTotal - paid;
        await tx.update(orders).set({ paidPaise: paid, balanceDuePaise: balance, paymentStatus: paymentStatus(paid, balance) })
          .where(eq(orders.id, id));
        await recordOrderEvent(tx, { ...baseEvent, kind: "cash", details: {
          amountPaise: amount, paidPaise: paid, balancePaise: balance, reason: reason || "Cash collected on delivery",
        } });
        return;
      }
      throw new InvalidOperation("Choose a valid order action.");
    });
  } catch (caught) {
    error = caught instanceof InvalidOperation ? caught.message : "The order could not be updated. Refresh and try again.";
  }
  redirect(path + (error ? "?error=" + encodeURIComponent(error) : "?saved=1"));
}
