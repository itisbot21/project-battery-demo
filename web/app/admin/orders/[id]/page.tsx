import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { notificationOutbox, orderEvents, orderItems, orders } from "@/db/schema";
import { AdminPage } from "@/components/admin/admin-page";
import { ChoiceSelect } from "@/components/design/choice-field";
import { Notice } from "@/components/design/commerce-ui";
import { ConfirmSubmit } from "@/components/design/modal";
import { SubmitButton } from "@/components/design/submit-button";
import { requireAdmin } from "@/lib/require-admin";
import { ORDER_TRANSITIONS, orderStatusLabel } from "@/lib/order-policy";
import { positiveId } from "@/lib/store-policy";
import { formatCurrency } from "@/lib/format-currency";
import { manageOrder } from "../actions";


const date = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
const statusAction: Record<string, string> = {
  confirmed: "Confirm delivery with customer", preparing: "Mark preparing", out_for_delivery: "Dispatch order",
  delivered: "Confirm installation", completed: "Complete order", failed_delivery: "Record failed delivery", cancelled: "Cancel and restore stock",
};
const auditFields: Record<string, string> = {
  itemId: "Line item", approved: "Accepted exchanges", rejected: "Declined exchanges", fromPaise: "Previous total",
  toPaise: "Revised total", adjustmentPaise: "Price adjustment", amountPaise: "Cash received",
  paidPaise: "Cash collected to date", balancePaise: "Balance due", totalPaise: "Original total",
  reason: "Reason", note: "Note", units: "Units restored", from: "Previous status", status: "Status",
};

export default async function AdminOrderDetail({ params, searchParams }: PageProps<"/admin/orders/[id]">) {
  await requireAdmin();
  const id = positiveId((await params).id);
  if (!id) notFound();
  const feedback = await searchParams;
  const [order] = await db.select().from(orders).where(eq(orders.id, id));
  if (!order) notFound();
  const [items, events, outbox] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, id)).orderBy(asc(orderItems.id)),
    db.select().from(orderEvents).where(eq(orderEvents.orderId, id)).orderBy(asc(orderEvents.id)),
    db.select({ id: notificationOutbox.id, status: notificationOutbox.status }).from(notificationOutbox)
      .innerJoin(orderEvents, eq(orderEvents.id, notificationOutbox.eventId)).where(eq(orderEvents.orderId, id)),
  ]);
  const operations = Object.hasOwn(ORDER_TRANSITIONS, order.orderStatus) ? ORDER_TRANSITIONS[order.orderStatus] : [];
  const canSettle = order.orderStatus === "out_for_delivery" && order.paymentMethod === "cod";
  const unresolved = items.some((item) => item.exchangeSelected && item.exchangeStatus === "pending");
  const total = order.finalTotalPaise ?? order.totalPaise;
  const actionFields = (operation: string) => <>
    <input type="hidden" name="orderId" value={id} /><input type="hidden" name="operation" value={operation} />
  </>;

  return <AdminPage title={"Order PB-" + id} description={orderStatusLabel(order.orderStatus) + " · " + date.format(order.createdAt)}>
    {feedback.saved === "1" && <div className="mb-3"><Notice tone="success">Order updated.</Notice></div>}
    {typeof feedback.error === "string" && <div className="mb-3"><Notice tone="critical">{feedback.error.slice(0, 220)}</Notice></div>}
    <div className="purchase-layout">
      <div className="grid min-w-0 gap-3">
        <section className="panel operations-card">
          <h2>Customer and delivery</h2>
          <p>{order.customerName} · <a className="text-link" href={"tel:" + order.mobile}>{order.mobile}</a></p>
          <p className="whitespace-pre-line">{order.address}, {order.city} {order.pinCode}</p>
        </section>
        <section className="panel operations-card">
          <h2>Ordered batteries</h2>
          {items.map((item) => <article className="grid gap-2 border-b pb-3 last:border-0" key={item.id}>
            <strong>{item.quantity} × {item.productBrand} {item.productModel}</strong>
            <p>{order.trackingTokenHash ? "Original line amount" : "Recorded line amount"} {formatCurrency(item.lineTotalPaise)}
              {item.finalLineTotalPaise !== null && item.finalLineTotalPaise !== item.lineTotalPaise && " · Adjusted to " + formatCurrency(item.finalLineTotalPaise)}</p>
            {item.exchangeSelected && <>
              <p>Exchange {item.exchangeStatus} · Without exchange {formatCurrency(item.withoutExchangeUnitPricePaise)} per battery</p>
              {item.approvedExchangeQuantity !== null && <p>{item.approvedExchangeQuantity} of {item.quantity} old batteries accepted.</p>}
              {canSettle && item.exchangeStatus === "pending" && <form className="checkout-cod" action={manageOrder}>
                {actionFields("exchange")}<input type="hidden" name="itemId" value={item.id} />
                <label>Old batteries accepted<input className="store-input max-w-28" type="number" min="0" max={item.quantity} step="1" name="approved" required /></label>
                <label>Reason if any exchange was declined<input className="store-input" name="reason" maxLength={500} /></label>
                <SubmitButton>Save exchange decision</SubmitButton>
              </form>}
            </>}
          </article>)}
        </section>
        <section className="panel operations-card">
          <h2>Order history</h2>
          {outbox.some((entry) => entry.status === "awaiting_provider") && <p className="muted">WhatsApp and SMS are awaiting provider setup.</p>}
          {!events.length && <p>There are no recorded events for this order.</p>}
          <ol className="grid gap-2">{events.map((event) => <li className="border-b pb-2" key={event.id}>
            <strong>{event.kind.replaceAll("_", " ")}</strong> · {date.format(event.createdAt)}
            {event.actorId && <p className="muted">Admin account {event.actorId}</p>}
            <dl>{Object.entries(event.details).filter(([, value]) => value !== null).map(([key, value]) => <div className="flex flex-wrap gap-1" key={key}>
              <dt>{auditFields[key] ?? key}</dt><dd>{key.endsWith("Paise") && typeof value === "number" ? formatCurrency(value) :
                (key === "status" || key === "from") && typeof value === "string" ? orderStatusLabel(value) : value}</dd>
            </div>)}</dl>
          </li>)}</ol>
          <form action={manageOrder}>{actionFields("note")}<label>Internal note<textarea className="store-input" name="reason" required maxLength={500} /></label>
            <SubmitButton>Add note</SubmitButton></form>
        </section>
      </div>
      <div className="grid min-w-0 gap-3">
        <section className="panel operations-card">
          <h2>Settlement</h2>
          <p>Payment method <strong>{order.paymentMethod === "cod" ? "Cash on delivery" : order.paymentMethod}</strong></p>
          <p>{order.trackingTokenHash ? "Original amount" : "Recorded amount"} {formatCurrency(order.totalPaise)}</p>
          <p>Current payable amount <strong>{formatCurrency(total)}</strong></p>
          <p>Cash collected {formatCurrency(order.paidPaise)} · Balance {formatCurrency(order.balanceDuePaise)}</p>
          {canSettle && unresolved && <p>Verify the exchanges before recording cash.</p>}
          {canSettle && !unresolved && order.balanceDuePaise > 0 && <form action={manageOrder}>
            {actionFields("cash")}<input type="hidden" name="expectedPaidPaise" value={order.paidPaise} />
            <label>Cash received (₹)<input className="store-input" name="amount" type="number" min=".01" max={(order.balanceDuePaise / 100).toFixed(2)}
              step=".01" defaultValue={(order.balanceDuePaise / 100).toFixed(2)} required /></label>
            <label>Collection note<input className="store-input" name="reason" maxLength={500} /></label>
            <SubmitButton primary>Record cash</SubmitButton>
          </form>}
        </section>
        {operations.length > 0 && <section className="panel operations-card">
          <h2>Delivery operations</h2>
          <form action={manageOrder}>
            {actionFields("status")}
            <ChoiceSelect key={order.orderStatus} label="Action" name="status" required placeholder="Choose an action"
              options={operations.map((status) => ({ value: status, label: statusAction[status] }))} />
            <label>Delivery note or reason<textarea className="store-input" name="reason" maxLength={500} placeholder="Required for cancellation or failed delivery" /></label>
            {operations.includes("cancelled") ?
              <ConfirmSubmit when={{ name: "status", value: "cancelled" }} title="Cancel this order?"
                description="Cancellation releases reserved batteries back to stock once the order is eligible." confirmLabel="Cancel order">Update status</ConfirmSubmit>
              : <SubmitButton primary>Update status</SubmitButton>}
          </form>
        </section>}
      </div>
    </div>
  </AdminPage>;
}
