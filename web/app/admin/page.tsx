import Link from "next/link";
import { and, asc, count, desc, inArray, lte } from "drizzle-orm";
import { db } from "@/db";
import { orders, products } from "@/db/schema";
import { AdminPage, AdminStatus } from "@/components/admin/admin-page";
import { LoadingPanel, Notice } from "@/components/design/commerce-ui";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/require-admin";
import { orderStatusLabel } from "@/lib/order-policy";
import { sellableProducts } from "@/lib/catalog";


export default async function AdminDashboard({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  return <Suspense fallback={<div className="store-container admin-screen"><LoadingPanel label="Loading operations overview…" /></div>}>
    <DashboardContent searchParams={searchParams} />
  </Suspense>;
}

async function DashboardContent({ searchParams }: { searchParams: PageProps<"/admin">["searchParams"] }) {
  const query = await searchParams;
  const [counts, stock, recent] = await Promise.all([
    db.select({ status: orders.orderStatus, total: count() }).from(orders).groupBy(orders.orderStatus),
    db.select({ id: products.id, brand: products.brand, model: products.model, stock: products.stock })
      .from(products).where(and(sellableProducts, lte(products.stock, 3))).orderBy(asc(products.stock), asc(products.id)).limit(12),
    db.select({ id: orders.id, status: orders.orderStatus, city: orders.city }).from(orders).orderBy(desc(orders.id)).limit(8),
  ]);
  const orderCount = new Map(counts.map(({ status, total }) => [status, total]));
  const countFor = (...statuses: string[]) => statuses.reduce((total, status) => total + (orderCount.get(status) ?? 0), 0);
  const inventory = await db.select({ active: products.active, stock: products.stock }).from(products).where(inArray(products.category, ["Car", "Bike"]));
  const active = inventory.filter((row) => row.active);
  return <AdminPage title="Overview" description="Orders, delivery and inventory at a glance.">
    {(query.updated === "1" || query.created === "1") && <Notice tone="success">Product saved.</Notice>}
    <div className="admin-metrics">
      <section className="panel admin-metric"><strong>{countFor("pending")}</strong><Link href="/admin/orders?status=pending">Awaiting customer confirmation</Link></section>
      <section className="panel admin-metric"><strong>{countFor("confirmed", "preparing", "out_for_delivery", "failed_delivery")}</strong><Link href="/admin/orders">Awaiting delivery</Link></section>
      <section className="panel admin-metric"><strong>{active.reduce((total, row) => total + row.stock, 0)} units</strong><Link href="/admin/products">{active.length} active battery listings</Link></section>
    </div>
    <div className="product-layout mt-4">
      <section className="panel operations-card"><h2>Recent orders</h2>
        {recent.map((order) => <div className="flex flex-wrap gap-2 border-b pb-2" key={order.id}><Link className="text-link" href={"/admin/orders/" + order.id}>PB-{order.id}</Link>
          <span className="muted">{order.city}</span><AdminStatus tone="active">{orderStatusLabel(order.status)}</AdminStatus></div>)}
        {!recent.length && <p>No orders yet.</p>}
      </section>
      <section className="panel operations-card"><h2>Low stock</h2><p className="muted">Active listings with three or fewer units.</p>
        {stock.map((product) => <div className="flex justify-between gap-2 border-b pb-2" key={product.id}>
          <Link className="text-link" href={"/admin/products/" + product.id + "/edit"}>{product.brand} {product.model}</Link><span>{product.stock}</span></div>)}
        {!stock.length && <p>No active listings are low on stock.</p>}
      </section>
    </div>
  </AdminPage>;
}
