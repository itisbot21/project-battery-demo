import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { asc, sql } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { AdminPage, AdminStatus, AdminTable } from "@/components/admin/admin-page";
import { requireAdmin } from "@/lib/require-admin";
import { formatCurrency } from "@/lib/format-currency";
import { positiveId } from "@/lib/store-policy";


export default async function AdminProducts({ searchParams }: PageProps<"/admin/products">) {
  await requireAdmin();
  const query = await searchParams;
  const q = typeof query.q === "string" ? query.q.trim().slice(0, 120) : "";
  const page = Math.min(positiveId(typeof query.page === "string" ? query.page : undefined) ?? 1, 1000);
  const rows = await db.select().from(products).where(q
    ? sql`position(${q.toLowerCase()} in lower(concat_ws(' ', ${products.brand}, ${products.model}))) > 0` : undefined)
    .orderBy(asc(products.brand), asc(products.model), asc(products.id)).limit(31).offset((page - 1) * 30);
  const url = (p: number) => "/admin/products?" + new URLSearchParams({ q, page: String(p) });
  return <AdminPage title="Products" actions={<Link className="shop-button primary" href="/admin/products/new"><Plus size={17} aria-hidden="true" /> Add battery</Link>}>
    <form className="panel operations-card mb-4" method="get">
      <div className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <label>Brand or model<span className="search-field"><Search size={16} aria-hidden="true" />
          <input name="q" type="search" className="store-input" defaultValue={q} />
        </span></label><button className="shop-button">Search inventory</button>
      </div>
    </form>
    <AdminTable caption="Inventory listings" columns={["Battery", "Category", "Listing", "Stock", "Without exchange"]} empty="No matching products."
      rows={rows.slice(0, 30).map((product) => {
        const active = product.active && ["Car", "Bike"].includes(product.category);
        return { id: product.id, cells: [
          <Link key="battery" className="text-link" href={"/admin/products/" + product.id + "/edit"}>{product.brand} {product.model}</Link>,
          product.category, <AdminStatus key="active" tone={active ? "success" : "neutral"}>{active ? "Active" : "Hidden"}</AdminStatus>,
          <span key="units" className="price">{product.stock}</span>, <span key="price" className="price">{formatCurrency(product.withoutExchangePaise)}</span>,
        ] };
      })} />
      {(page > 1 || rows.length > 30) && <nav className="catalog-pagination" aria-label="Inventory pages">
        {page > 1 && <Link className="shop-button" href={url(page - 1)}>Previous</Link>}
        <span>Page {page}</span>{rows.length > 30 && page < 1000 && <Link className="shop-button" href={url(page + 1)}>Next</Link>}
      </nav>}
  </AdminPage>;
}
