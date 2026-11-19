import Link from "next/link";
import { Search } from "lucide-react";
import { ChoiceSelect } from "@/components/design/choice-field";
import { and, desc, eq, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { AdminPage, AdminStatus, AdminTable } from "@/components/admin/admin-page";
import { requireAdmin } from "@/lib/require-admin";
import { formatCurrency } from "@/lib/format-currency";
import { ORDER_STATUS_LABELS, orderStatusLabel } from "@/lib/order-policy";
import { positiveId } from "@/lib/store-policy";


export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdmin();
  const query = await searchParams;
  const status = typeof query.status === "string" && Object.hasOwn(ORDER_STATUS_LABELS, query.status) ? query.status : "";
  const search = typeof query.q === "string" ? query.q.trim().slice(0, 40) : "";
  const page = Math.min(positiveId(typeof query.page === "string" ? query.page : undefined) ?? 1, 1000);
  const orderId = positiveId(search.replace(/^PB-/i, ""));
  const filters: (SQL | undefined)[] = [status ? eq(orders.orderStatus, status) : undefined];
  if (search) filters.push(/^[6-9][0-9]{9}$/.test(search) ? eq(orders.mobile, search) : eq(orders.id, orderId ?? 0));
  const rows = await db.select({
    id: orders.id, name: orders.customerName, city: orders.city, status: orders.orderStatus, createdAt: orders.createdAt,
    estimate: orders.totalPaise, total: orders.finalTotalPaise, balance: orders.balanceDuePaise,
  }).from(orders).where(and(...filters)).orderBy(desc(orders.id)).limit(31).offset((page - 1) * 30);
  const url = (p: number) => "/admin/orders?" + new URLSearchParams({ status, q: search, page: String(p) });
  return <AdminPage title="Orders" description="Find a customer order and manage delivery or settlement.">
    <form className="panel operations-card mb-4" method="get">
      <div className="grid items-end gap-3 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)_auto]">
        <label>Order reference or mobile<span className="search-field"><Search size={16} aria-hidden="true" />
          <input type="search" className="store-input" name="q" defaultValue={search} placeholder="PB-123 or 10-digit mobile" />
        </span></label>
        <ChoiceSelect label="Status" name="status" defaultValue={status} options={[
          { value: "", label: "All statuses" }, ...Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({ value, label })),
        ]} />
        <button className="shop-button primary">Find orders</button>
      </div>
    </form>
    <AdminTable caption="Matching orders" columns={["Order", "Customer", "Status", "Payable", "Balance"]} empty="No matching orders."
      rows={rows.slice(0, 30).map((order) => ({ id: order.id, cells: [
        <Link key="order" className="text-link" href={"/admin/orders/" + order.id}>PB-{order.id}</Link>,
        <span key="customer">{order.name}<small className="muted">{order.city}</small></span>,
        <AdminStatus key="status" tone={order.status === "cancelled" ? "critical" : order.status === "completed" ? "success" : "active"}>{orderStatusLabel(order.status)}</AdminStatus>,
        <strong key="total" className="price">{formatCurrency(order.total ?? order.estimate)}</strong>,
        <span key="balance" className="price">{formatCurrency(order.balance)}</span>,
      ] }))} />
      {(page > 1 || rows.length > 30) && <nav className="catalog-pagination" aria-label="Order result pages">
        {page > 1 && <Link className="shop-button" href={url(page - 1)}>Previous</Link>}
        <span>Page {page}</span>
        {rows.length > 30 && page < 1000 && <Link className="shop-button" href={url(page + 1)}>Next</Link>}
      </nav>}
  </AdminPage>;
}
