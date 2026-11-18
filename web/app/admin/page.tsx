import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { db } from "@/db";
import { products } from "@/db/schema";

export const instant = false;

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{
    created?: string;
    updated?: string;
  }>;
}) {
  const session = await requireAdmin();

  const query = await searchParams;

  const inventory = await db.select().from(products);

  const totalStock = inventory.reduce(
    (total, product) => total + product.stock,
    0
  );

  const activeProducts = inventory.filter(
    (product) => product.active
  ).length;

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl">

        <p className="text-sm font-bold text-orange-600">
          PROJECT BATTERY
        </p>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Admin Dashboard
            </h1>

            <p className="mt-2 text-slate-600">
              Welcome, {session.user.name}
            </p>
          </div>

          <Link
            href="/admin/products/new"
            className="rounded-lg bg-orange-600 px-5 py-3 font-semibold text-white hover:bg-orange-700"
          >
            + Add New Battery
          </Link>

          <Link
  href="/admin/pincodes"
  className="rounded-lg border border-orange-300 px-5 py-3 font-semibold text-orange-700 hover:bg-orange-50"
>
  Manage Delivery PIN Codes
</Link>
        </div>

        {(query.created === "1" ||
          query.updated === "1") && (
          <div className="mt-6 rounded-lg bg-green-50 p-4 text-green-800">
            {query.created === "1"
              ? "Battery added successfully!"
              : "Battery updated successfully!"}
          </div>
        )}

        {/* Dashboard Statistics */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Products
            </p>

            <p className="mt-2 text-3xl font-bold">
              {inventory.length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Active Products
            </p>

            <p className="mt-2 text-3xl font-bold">
              {activeProducts}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Battery Units
            </p>

            <p className="mt-2 text-3xl font-bold">
              {totalStock}
            </p>
          </div>

        </div>

        {/* Inventory List */}
        <section className="mt-8 rounded-xl bg-white p-6 shadow-sm">

          <h2 className="text-xl font-bold">
            Battery Inventory
          </h2>

          <div className="mt-5 space-y-3">

            {inventory.map((product) => (
              <div
                key={product.id}
                className="flex flex-wrap items-center justify-between gap-4 border-b py-4"
              >
                <div>
                  <p className="font-semibold">
                    {product.brand} {product.model}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {product.category} Battery
                  </p>

                  <p className={`mt-2 text-sm font-medium ${
                    product.active
                      ? "text-green-700"
                      : "text-red-600"
                  }`}>
                    {product.active ? "● Active" : "● Inactive"}
                  </p>
                </div>

                <div className="flex items-center gap-5">
                  <p className="text-sm font-medium">
                    {product.stock} units
                  </p>

                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    className="rounded-lg border border-orange-300 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}

            {inventory.length === 0 && (
              <p className="py-6 text-slate-500">
                No batteries in inventory yet.
              </p>
            )}

          </div>
        </section>

      </div>
    </main>
  );
}
