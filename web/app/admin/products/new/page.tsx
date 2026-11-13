
import Link from "next/link";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { products } from "@/db/schema";

// Check admin permissions on the server
async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/admin/login");
  }

  const roles = session.user.role?.split(",") ?? [];

  if (!roles.includes("admin")) {
    notFound();
  }

  return session;
}

// Read text from our form
function field(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === "string" ? value.trim() : "";
}

// Convert rupees to paise without floating-point errors
function toPaise(value: string): number | null {
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(value)) {
    return null;
  }

  const [rupees, decimals = ""] = value.split(".");

  return (
    Number(rupees) * 100 +
    Number(decimals.padEnd(2, "0"))
  );
}

function wholeNumber(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;

  const number = Number(value);

  return Number.isSafeInteger(number) &&
    number <= 1000000
    ? number
    : null;
}

// Runs on the server when the form is submitted
async function createProduct(formData: FormData) {
  "use server";

  await requireAdmin();

  const brand = field(formData, "brand");
  const model = field(formData, "model");
  const category = field(formData, "category");

  const capacityText = field(formData, "capacity");
  const warrantyText = field(formData, "warranty");

  const capacityAh = capacityText
    ? wholeNumber(capacityText)
    : null;

  const warrantyMonths = warrantyText
    ? wholeNumber(warrantyText)
    : null;

  const mrpPaise = toPaise(field(formData, "mrp"));
  const withoutExchangePaise = toPaise(
    field(formData, "withoutExchange")
  );
  const withExchangePaise = toPaise(
    field(formData, "withExchange")
  );

  const stock = wholeNumber(field(formData, "stock"));

  const allowedCategories = [
    "Car",
    "Bike",
    "Inverter",
    "Truck",
  ];

  // Validate ALL values on the server
  if (
    brand.length < 2 ||
    brand.length > 80 ||
    model.length < 2 ||
    model.length > 120 ||
    !allowedCategories.includes(category) ||
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
    redirect("/admin/products/new?error=invalid");
  }

  // Generate a URL-friendly product identifier
  const slug = `${brand}-${model}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  if (!slug) {
    redirect("/admin/products/new?error=invalid");
  }

  let saved = false;

  try {
    const inserted = await db
      .insert(products)
      .values({
        slug,
        brand,
        model,
        category,
        capacityAh,
        warrantyMonths,
        mrpPaise,
        withoutExchangePaise,
        withExchangePaise,
        stock,
        active: true,
      })
      .onConflictDoNothing()
      .returning({ id: products.id });

    saved = inserted.length > 0;
  } catch (error) {
    console.error("Product creation failed:", error);
    redirect("/admin/products/new?error=database");
  }

  if (!saved) {
    redirect("/admin/products/new?error=duplicate");
  }

  revalidatePath("/");
  revalidatePath("/admin");

  redirect("/admin?created=1");
}

const inputStyle =
  "mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-orange-500";

export default async function AddProductPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();

  const { error } = await searchParams;

  const errorMessages: Record<string, string> = {
    invalid: "Check the product details and prices.",
    duplicate: "This brand and model already exist.",
    database: "Unable to save the product. Try again.",
  };

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-10 text-slate-900">
      <div className="mx-auto max-w-3xl">

        <Link
          href="/admin"
          className="text-sm font-medium text-orange-600"
        >
          ← Back to Dashboard
        </Link>

        <h1 className="mt-5 text-3xl font-bold">
          Add New Battery
        </h1>

        <p className="mt-2 text-slate-500">
          Add products to your store inventory.
        </p>

        {error && (
          <div role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {errorMessages[error] ?? "Something went wrong."}
          </div>
        )}

        <form action={createProduct} className="mt-8 space-y-6">

          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">
              Battery Information
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">

              <label className="block text-sm font-medium">
                Brand *
                <input
                  name="brand"
                  required
                  maxLength={80}
                  placeholder="e.g. Exide"
                  className={inputStyle}
                />
              </label>

              <label className="block text-sm font-medium">
                Battery Model *
                <input
                  name="model"
                  required
                  maxLength={120}
                  placeholder="e.g. Example Model 45Ah"
                  className={inputStyle}
                />
              </label>

              <label className="block text-sm font-medium">
                Category *
                <select
                  name="category"
                  required
                  defaultValue=""
                  className={inputStyle}
                >
                  <option value="" disabled>
                    Select category
                  </option>
                  <option value="Car">Car Battery</option>
                  <option value="Bike">Bike Battery</option>
                  <option value="Inverter">Inverter Battery</option>
                  <option value="Truck">Truck Battery</option>
                </select>
              </label>

              <label className="block text-sm font-medium">
                Capacity (Ah)
                <input
                  name="capacity"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="45"
                  className={inputStyle}
                />
              </label>

              <label className="block text-sm font-medium">
                Warranty (Months)
                <input
                  name="warranty"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="24"
                  className={inputStyle}
                />
              </label>

              <label className="block text-sm font-medium">
                Stock Quantity *
                <input
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue="0"
                  required
                  className={inputStyle}
                />
              </label>

            </div>
          </section>

          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">
              Battery Pricing
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Enter prices in rupees, inclusive of GST.
            </p>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">

              <label className="block text-sm font-medium">
                MRP (₹) *
                <input
                  name="mrp"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="7500"
                  required
                  className={inputStyle}
                />
              </label>

              <label className="block text-sm font-medium">
                Without Old Battery (₹) *
                <input
                  name="withoutExchange"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="5500"
                  required
                  className={inputStyle}
                />
              </label>

              <label className="block text-sm font-medium sm:col-span-2">
                With Old Battery (₹) *
                <input
                  name="withExchange"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="4500"
                  required
                  className={inputStyle}
                />
              </label>

            </div>

            <div className="mt-5 rounded-lg bg-orange-50 p-4 text-sm text-orange-900">
              Exchange prices are subject to staff
              verification at delivery.
            </div>
          </section>

          <button
            type="submit"
            className="w-full rounded-xl bg-orange-600 px-6 py-4 font-bold text-white transition hover:bg-orange-700"
          >
            Save Battery to Database
          </button>

        </form>
      </div>
    </main>
  );
}