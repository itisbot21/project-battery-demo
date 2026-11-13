import Link from "next/link";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
export const instant = false;

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { products } from "@/db/schema";

async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/admin/login");

  const roles = session.user.role?.split(",") ?? [];

  if (!roles.includes("admin")) notFound();
}

function getField(data: FormData, key: string) {
  const value = data.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function toPaise(value: string) {
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(value)) {
    return null;
  }

  const [rupees, paise = ""] = value.split(".");

  return Number(rupees) * 100 +
    Number(paise.padEnd(2, "0"));
}

function toInteger(value: string) {
  if (!/^\d+$/.test(value)) return null;

  const number = Number(value);

  return Number.isSafeInteger(number) &&
    number <= 1000000
    ? number
    : null;
}

function priceForInput(paise: number) {
  return (paise / 100).toFixed(2);
}

// Server Action - securely update the product
async function updateProduct(
  productId: number,
  formData: FormData
) {
  "use server";

  await requireAdmin();

  const brand = getField(formData, "brand");
  const model = getField(formData, "model");
  const category = getField(formData, "category");

  const capacityText = getField(formData, "capacity");
  const warrantyText = getField(formData, "warranty");

  const capacityAh = capacityText
    ? toInteger(capacityText)
    : null;

  const warrantyMonths = warrantyText
    ? toInteger(warrantyText)
    : null;

  const mrpPaise = toPaise(getField(formData, "mrp"));

  const withoutExchangePaise = toPaise(
    getField(formData, "withoutExchange")
  );

  const withExchangePaise = toPaise(
    getField(formData, "withExchange")
  );

  const stock = toInteger(getField(formData, "stock"));
  const active = formData.get("active") === "on";

  const categories = ["Car", "Bike", "Inverter", "Truck"];

  if (
    brand.length < 2 ||
    brand.length > 80 ||
    model.length < 2 ||
    model.length > 120 ||
    !categories.includes(category) ||
    mrpPaise === null ||
    withoutExchangePaise === null ||
    withExchangePaise === null ||
    mrpPaise <= 0 ||
    withoutExchangePaise <= 0 ||
    withExchangePaise <= 0 ||
    withoutExchangePaise > mrpPaise ||
    withExchangePaise > withoutExchangePaise ||
    stock === null ||
    (capacityText !== "" &&
      (capacityAh === null || capacityAh <= 0)) ||
    (warrantyText !== "" &&
      (warrantyMonths === null || warrantyMonths <= 0))
  ) {
    redirect(
      `/admin/products/${productId}/edit?error=invalid`
    );
  }

  let updated = false;

  try {
    const result = await db
      .update(products)
      .set({
        brand,
        model,
        category,
        capacityAh,
        warrantyMonths,
        mrpPaise,
        withoutExchangePaise,
        withExchangePaise,
        stock,
        active,
      })
      .where(eq(products.id, productId))
      .returning({ id: products.id });

    updated = result.length > 0;
  } catch (error) {
    console.error("Failed to update product:", error);

    redirect(
      `/admin/products/${productId}/edit?error=database`
    );
  }

  if (!updated) notFound();

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/api/products");

  redirect("/admin?updated=1");
}

const inputClass =
  "mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-orange-500 focus:outline-none";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  const { error } = await searchParams;

  const productId = Number(id);

  if (!Number.isSafeInteger(productId) || productId <= 0) {
    notFound();
  }

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!product) notFound();

  const saveProduct = updateProduct.bind(null, product.id);

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-10 text-slate-900">
      <div className="mx-auto max-w-3xl">

        <Link
          href="/admin"
          className="text-sm font-semibold text-orange-600"
        >
          ← Back to Dashboard
        </Link>

        <h1 className="mt-5 text-3xl font-bold">
          Edit Battery
        </h1>

        <p className="mt-2 text-slate-500">
          Update {product.brand} {product.model}
        </p>

        {error && (
          <div role="alert" className="mt-5 rounded-lg bg-red-50 p-4 text-red-700">
            {error === "invalid"
              ? "Please check all product details and prices."
              : "Could not update this battery. Try again."}
          </div>
        )}

        <form action={saveProduct} className="mt-8 space-y-6">

          {/* Battery Details */}
          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">
              Battery Information
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">

              <label className="text-sm font-medium">
                Brand
                <input
                  name="brand"
                  required
                  maxLength={80}
                  defaultValue={product.brand}
                  className={inputClass}
                />
              </label>

              <label className="text-sm font-medium">
                Battery Model
                <input
                  name="model"
                  required
                  maxLength={120}
                  defaultValue={product.model}
                  className={inputClass}
                />
              </label>

              <label className="text-sm font-medium">
                Category
                <select
                  name="category"
                  defaultValue={product.category}
                  className={inputClass}
                >
                  {["Car", "Bike", "Inverter", "Truck"].map(
                    (category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label className="text-sm font-medium">
                Capacity (Ah)
                <input
                  name="capacity"
                  type="number"
                  min="1"
                  step="1"
                  defaultValue={product.capacityAh ?? ""}
                  className={inputClass}
                />
              </label>

              <label className="text-sm font-medium">
                Warranty (Months)
                <input
                  name="warranty"
                  type="number"
                  min="1"
                  step="1"
                  defaultValue={product.warrantyMonths ?? ""}
                  className={inputClass}
                />
              </label>

              <label className="text-sm font-medium">
                Stock Quantity
                <input
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  required
                  defaultValue={product.stock}
                  className={inputClass}
                />
              </label>

            </div>
          </section>

          {/* Pricing */}
          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">
              Battery Pricing
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              All prices must include applicable GST.
            </p>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">

              <label className="text-sm font-medium">
                MRP (₹)
                <input
                  name="mrp"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  defaultValue={priceForInput(product.mrpPaise)}
                  className={inputClass}
                />
              </label>

              <label className="text-sm font-medium">
                Without Old Battery (₹)
                <input
                  name="withoutExchange"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  defaultValue={priceForInput(
                    product.withoutExchangePaise
                  )}
                  className={inputClass}
                />
              </label>

              <label className="text-sm font-medium sm:col-span-2">
                With Old Battery (₹)
                <input
                  name="withExchange"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  defaultValue={priceForInput(
                    product.withExchangePaise
                  )}
                  className={inputClass}
                />
              </label>

            </div>
          </section>

          {/* Availability */}
          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">
              Product Availability
            </h2>

            <label className="mt-5 flex items-center gap-3">
              <input
                type="checkbox"
                name="active"
                defaultChecked={product.active}
                className="h-5 w-5 accent-orange-600"
              />

              <span className="font-medium">
                Product is active on the website
              </span>
            </label>

            <p className="mt-3 text-sm text-slate-500">
              Uncheck to hide this battery from the customer
              website without deleting its database record.
            </p>
          </section>

          <button
            type="submit"
            className="w-full rounded-xl bg-orange-600 px-6 py-4 font-bold text-white hover:bg-orange-700"
          >
            Save Changes
          </button>

        </form>

      </div>
    </main>
  );
}