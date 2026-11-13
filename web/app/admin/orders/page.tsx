
import { Suspense } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { refresh } from "next/cache";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { and, desc, eq, inArray } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";

function money(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(paise / 100);
}

function dateTime(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function label(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const roles =
    session?.user.role
      ?.split(",")
      .map((role) => role.trim()) ?? [];

  if (!session || !roles.includes("admin")) {
    throw new Error("Unauthorized");
  }
}

function createPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL missing");
  }

  return new Pool({
    connectionString: process.env.DATABASE_URL,
  });
}

const nextStatuses: Record<string, string> = {
  pending: "confirmed",
  confirmed: "out_for_delivery",
  out_for_delivery: "delivered",
};

// UPDATE ORDER STATUS
async function updateOrderStatus(formData: FormData) {
  "use server";

  await requireAdmin();

  const orderId = Number(formData.get("orderId"));
  const nextStatus = formData.get("nextStatus");

  if (
    !Number.isSafeInteger(orderId) ||
    orderId <= 0 ||
    typeof nextStatus !== "string"
  ) {
    return;
  }

  const pool = createPool();

  try {
    const database = drizzle({ client: pool });

    await database.transaction(async (tx) => {
      const [order] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .for("update");

      if (!order) return;

      if (nextStatuses[order.orderStatus] !== nextStatus) {
        return;
      }

      if (nextStatus === "delivered") {
        const pending = await tx
          .select({ id: orderItems.id })
          .from(orderItems)
          .where(
            and(
              eq(orderItems.orderId, orderId),
              eq(orderItems.exchangeSelected, true),
              eq(orderItems.exchangeStatus, "pending")
            )
          )
          .limit(1);

        if (pending.length > 0) return;

        // Collect and record payment before completing delivery.
        if (order.balanceDuePaise > 0) return;
      }

      await tx
        .update(orders)
        .set({ orderStatus: nextStatus })
        .where(eq(orders.id, orderId));
    });
  } finally {
    await pool.end();
  }

  refresh();
}

// VERIFY OLD BATTERY EXCHANGE
async function verifyExchange(formData: FormData) {
  "use server";

  await requireAdmin();

  const itemId = Number(formData.get("itemId"));
  const decision = formData.get("decision");

  if (
    !Number.isSafeInteger(itemId) ||
    itemId <= 0 ||
    (decision !== "approved" && decision !== "rejected")
  ) {
    return;
  }

  const pool = createPool();

  try {
    const database = drizzle({ client: pool });

    await database.transaction(async (tx) => {
      const [reference] = await tx
        .select({ orderId: orderItems.orderId })
        .from(orderItems)
        .where(eq(orderItems.id, itemId));

      if (!reference) return;

      const [order] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, reference.orderId))
        .for("update");

      if (!order) return;

      const [item] = await tx
        .select()
        .from(orderItems)
        .where(eq(orderItems.id, itemId))
        .for("update");

      if (
        !item ||
        !item.exchangeSelected ||
        item.exchangeStatus !== "pending" ||
        order.orderStatus !== "out_for_delivery"
      ) {
        return;
      }

      if (decision === "approved") {
        await tx
          .update(orderItems)
          .set({ exchangeStatus: "approved" })
          .where(eq(orderItems.id, itemId));

        return;
      }

      const difference =
        (item.withoutExchangeUnitPricePaise -
          item.unitPricePaise) *
        item.quantity;

      const newTotal = order.totalPaise + difference;

      if (
        difference < 0 ||
        !Number.isSafeInteger(newTotal) ||
        newTotal > 2_147_483_647
      ) {
        throw new Error("Invalid revised order amount");
      }

      const balance = Math.max(
        0,
        newTotal - order.paidPaise
      );

      await tx
        .update(orderItems)
        .set({
          exchangeStatus: "rejected",
          unitPricePaise:
            item.withoutExchangeUnitPricePaise,
          lineTotalPaise:
            item.withoutExchangeUnitPricePaise *
            item.quantity,
        })
        .where(eq(orderItems.id, itemId));

      await tx
        .update(orders)
        .set({
          totalPaise: newTotal,
          balanceDuePaise: balance,
          paymentStatus:
            balance === 0
              ? "paid"
              : order.paidPaise > 0
                ? "partial"
                : "pending",
        })
        .where(eq(orders.id, order.id));
    });
  } finally {
    await pool.end();
  }

  refresh();
}

// RECORD MANUAL PAYMENT
async function recordPayment(formData: FormData) {
  "use server";

  await requireAdmin();

  const orderId = Number(formData.get("orderId"));
  const amount = formData.get("amount");

  if (
    !Number.isSafeInteger(orderId) ||
    orderId <= 0 ||
    typeof amount !== "string" ||
    !/^(?:0|[1-9]\d{0,7})(?:\.\d{1,2})?$/.test(amount)
  ) {
    throw new Error("Invalid payment amount.");
  }

  // Convert rupees to paise without floating-point errors.
  const [rupees, fraction = ""] = amount.split(".");
  const amountPaise =
    Number(rupees) * 100 +
    Number(fraction.padEnd(2, "0"));

  if (
    !Number.isSafeInteger(amountPaise) ||
    amountPaise <= 0
  ) {
    throw new Error("Payment must be greater than zero.");
  }

  const pool = createPool();

  try {
    const database = drizzle({ client: pool });

    await database.transaction(async (tx) => {
      const [order] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .for("update");

      if (!order) {
        throw new Error("Order not found.");
      }

      if (
        order.orderStatus !== "out_for_delivery" &&
        order.orderStatus !== "delivered"
      ) {
        throw new Error(
          "Payment recording is available at delivery."
        );
      }

      const pending = await tx
        .select({ id: orderItems.id })
        .from(orderItems)
        .where(
          and(
            eq(orderItems.orderId, orderId),
            eq(orderItems.exchangeSelected, true),
            eq(orderItems.exchangeStatus, "pending")
          )
        )
        .limit(1);

      if (pending.length > 0) {
        throw new Error(
          "Verify all exchanges before recording payment."
        );
      }

      if (amountPaise > order.balanceDuePaise) {
        throw new Error(
          "Payment exceeds the outstanding balance."
        );
      }

      const newPaid = order.paidPaise + amountPaise;
      const newBalance = order.totalPaise - newPaid;

      if (
        !Number.isSafeInteger(newPaid) ||
        newBalance < 0
      ) {
        throw new Error("Invalid payment total.");
      }

      await tx
        .update(orders)
        .set({
          paidPaise: newPaid,
          balanceDuePaise: newBalance,
          paymentStatus:
            newBalance === 0 ? "paid" : "partial",
        })
        .where(eq(orders.id, order.id));
    });
  } finally {
    await pool.end();
  }

  refresh();
}

// ADMIN ORDERS DASHBOARD
async function OrdersContent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/admin/login");

  const roles =
    session.user.role
      ?.split(",")
      .map((r) => r.trim()) ?? [];

  if (!roles.includes("admin")) notFound();

  const orderRows = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(100);

  const itemRows = orderRows.length
    ? await db
        .select()
        .from(orderItems)
        .where(
          inArray(
            orderItems.orderId,
            orderRows.map((o) => o.id)
          )
        )
    : [];

  const itemsByOrder = new Map<number, typeof itemRows>();

  for (const item of itemRows) {
    const current = itemsByOrder.get(item.orderId) ?? [];
    current.push(item);
    itemsByOrder.set(item.orderId, current);
  }

  const pendingOrders = orderRows.filter(
    (o) => o.orderStatus === "pending"
  ).length;

  const totalValue = orderRows.reduce(
    (sum, o) => sum + o.totalPaise,
    0
  );

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/admin"
          className="text-sm font-medium text-orange-600"
        >
          ← Back to Dashboard
        </Link>

        <div className="mt-6">
          <p className="font-bold text-orange-600">
            PROJECT BATTERY
          </p>
          <h1 className="mt-2 text-3xl font-bold">
            Order Management
          </h1>
          <p className="mt-2 text-slate-600">
            Manage delivery, exchange and payments.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-6">
            <p className="text-sm text-slate-500">
              Recent Orders
            </p>
            <p className="mt-2 text-3xl font-bold">
              {orderRows.length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6">
            <p className="text-sm text-slate-500">
              Pending Orders
            </p>
            <p className="mt-2 text-3xl font-bold">
              {pendingOrders}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6">
            <p className="text-sm text-slate-500">
              Recent Order Value
            </p>
            <p className="mt-2 text-2xl font-bold">
              {money(totalValue)}
            </p>
          </div>
        </div>

        {orderRows.length === 0 && (
          <div className="mt-8 rounded-xl bg-white p-8 text-center">
            No orders found.
          </div>
        )}

        <div className="mt-8 space-y-6">
          {orderRows.map((order) => {
            const items = itemsByOrder.get(order.id) ?? [];
            const nextStatus =
              nextStatuses[order.orderStatus];

            const pendingExchange = items.some(
              (item) =>
                item.exchangeSelected &&
                item.exchangeStatus === "pending"
            );

            const canRecordPayment =
              (order.orderStatus === "out_for_delivery" ||
                order.orderStatus === "delivered") &&
              !pendingExchange &&
              order.balanceDuePaise > 0;

            const canUpdate =
              Boolean(nextStatus) &&
              (nextStatus !== "delivered" ||
                (!pendingExchange &&
                  order.balanceDuePaise === 0));

            return (
              <section
                key={order.id}
                className="overflow-hidden rounded-2xl border bg-white shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-5">
                  <div>
                    <h2 className="text-xl font-bold">
                      Order #{order.id}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {dateTime(order.createdAt)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-bold">
                      {money(order.totalPaise)}
                    </p>
                    <p className="font-medium text-orange-700">
                      {label(order.orderStatus)}
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 border-t p-5 md:grid-cols-2">
                  <div>
                    <h3 className="font-bold">
                      Customer Details
                    </h3>
                    <p className="mt-3">
                      {order.customerName}
                    </p>
                    <p>{order.mobile}</p>
                    <p className="mt-2 text-sm text-slate-600">
                      {order.address}
                    </p>
                    <p className="text-sm text-slate-600">
                      {order.city} — {order.pinCode}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold">
                      Payment Summary
                    </h3>
                    <div className="mt-3 space-y-2 text-sm">
                      <p>
                        Method:{" "}
                        <strong>
                          {order.paymentMethod.toUpperCase()}
                        </strong>
                      </p>
                      <p>
                        Status:{" "}
                        <strong>
                          {label(order.paymentStatus)}
                        </strong>
                      </p>
                      <p>
                        Paid:{" "}
                        <strong className="text-green-700">
                          {money(order.paidPaise)}
                        </strong>
                      </p>
                      <p>
                        Balance Due:{" "}
                        <strong className="text-orange-700">
                          {money(order.balanceDuePaise)}
                        </strong>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t p-5">
                  <h3 className="font-bold">
                    Ordered Batteries
                  </h3>

                  <div className="mt-4 space-y-3">
                    {items.map((item) => {
                      const extra = Math.max(
                        0,
                        (item.withoutExchangeUnitPricePaise -
                          item.unitPricePaise) *
                          item.quantity
                      );

                      const canVerify =
                        item.exchangeSelected &&
                        item.exchangeStatus === "pending" &&
                        order.orderStatus ===
                          "out_for_delivery";

                      return (
                        <div
                          key={item.id}
                          className="rounded-xl bg-slate-50 p-4"
                        >
                          <div className="flex flex-wrap justify-between gap-4">
                            <div>
                              <p className="font-semibold">
                                {item.productBrand}{" "}
                                {item.productModel}
                              </p>
                              <p className="mt-1 text-sm">
                                Quantity: {item.quantity}
                              </p>
                              <p className="text-sm text-slate-500">
                                {item.exchangeSelected
                                  ? "With Exchange"
                                  : "Without Exchange"}
                              </p>
                              {item.exchangeSelected && (
                                <p className="mt-1 text-sm">
                                  Exchange:{" "}
                                  {label(item.exchangeStatus)}
                                </p>
                              )}
                            </div>

                            <strong>
                              {money(item.lineTotalPaise)}
                            </strong>
                          </div>

                          {canVerify && (
                            <div className="mt-4 border-t pt-4">
                              <p className="mb-3 text-sm font-medium">
                                Verify old battery
                              </p>

                              <div className="flex flex-wrap gap-3">
                                <form action={verifyExchange}>
                                  <input
                                    type="hidden"
                                    name="itemId"
                                    value={item.id}
                                  />
                                  <input
                                    type="hidden"
                                    name="decision"
                                    value="approved"
                                  />
                                  <button
                                    type="submit"
                                    className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white"
                                  >
                                    Approve Exchange
                                  </button>
                                </form>

                                <form action={verifyExchange}>
                                  <input
                                    type="hidden"
                                    name="itemId"
                                    value={item.id}
                                  />
                                  <input
                                    type="hidden"
                                    name="decision"
                                    value="rejected"
                                  />
                                  <button
                                    type="submit"
                                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
                                  >
                                    Reject Exchange
                                  </button>
                                </form>
                              </div>

                              <p className="mt-2 text-xs text-slate-500">
                                Rejection adds {money(extra)}.
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t p-5">
                  <h3 className="text-lg font-bold">
                    Record Payment
                  </h3>

                  {canRecordPayment ? (
                    <form
                      action={recordPayment}
                      className="mt-4 flex flex-wrap items-end gap-3"
                    >
                      <input
                        type="hidden"
                        name="orderId"
                        value={order.id}
                      />

                      <label className="text-sm font-medium">
                        Amount Received (₹)
                        <input
                          name="amount"
                          type="number"
                          min="0.01"
                          max={(
                            order.balanceDuePaise / 100
                          ).toFixed(2)}
                          step="0.01"
                          required
                          placeholder="Enter amount"
                          className="mt-2 block w-48 rounded-lg border p-3"
                        />
                      </label>

                      <button
                        type="submit"
                        className="rounded-lg bg-green-700 px-5 py-3 font-semibold text-white"
                      >
                        Record Payment
                      </button>
                    </form>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">
                      {order.balanceDuePaise === 0
                        ? "Payment fully recorded."
                        : pendingExchange
                          ? "Verify all exchanges first."
                          : "Payment recording becomes available at delivery."}
                    </p>
                  )}

                  <p className="mt-3 text-xs text-slate-500">
                    Only record payments actually received.
                    Amounts are stored in the order summary.
                  </p>
                </div>

                <div className="border-t bg-slate-50 p-5">
                  <h3 className="font-bold">
                    Update Order Status
                  </h3>

                  <p className="mt-2 text-sm">
                    Current:{" "}
                    <strong>
                      {label(order.orderStatus)}
                    </strong>
                  </p>

                  {canUpdate ? (
                    <form
                      action={updateOrderStatus}
                      className="mt-4"
                    >
                      <input
                        type="hidden"
                        name="orderId"
                        value={order.id}
                      />
                      <input
                        type="hidden"
                        name="nextStatus"
                        value={nextStatus}
                      />

                      <button
                        type="submit"
                        className="rounded-lg bg-orange-600 px-5 py-3 font-semibold text-white"
                      >
                        Mark as {label(nextStatus)}
                      </button>
                    </form>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">
                      {order.orderStatus === "delivered"
                        ? "Order delivered."
                        : pendingExchange
                          ? "Verify exchanges before delivery."
                          : order.balanceDuePaise > 0 &&
                              nextStatus === "delivered"
                            ? "Record the remaining payment before completing delivery."
                            : "No further updates available."}
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense
      fallback={
        <main className="p-8">
          Loading admin orders...
        </main>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}
