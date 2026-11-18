
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";

import { requireAdmin } from "@/lib/require-admin";
import { db } from "@/db";
import {
  batteryCompatibility,
  products,
  vehicles,
} from "@/db/schema";
import {
  ProductForm,
} from "@/components/admin/product-form";
import { updateProduct } from "../../actions";

export const instant = false;

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  // ADMIN ACCESS ONLY
  await requireAdmin();

  const [{ id }, { error }] = await Promise.all([
    params,
    searchParams,
  ]);

  const productId = Number(id);

  if (
    !Number.isSafeInteger(productId) ||
    productId <= 0
  ) {
    notFound();
  }

  // LOAD PRODUCT, VEHICLES AND SAVED FITMENTS
  const [
    [product],
    availableVehicles,
    savedFitments,
  ] = await Promise.all([
    db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1),

    db
      .select()
      .from(vehicles)
      .orderBy(
        vehicles.type,
        vehicles.brand,
        vehicles.model,
        vehicles.variant
      ),

    db
      .select({
        vehicleId: batteryCompatibility.vehicleId,
      })
      .from(batteryCompatibility)
      .where(
        eq(
          batteryCompatibility.productId,
          productId
        )
      ),
  ]);

  // PRODUCT NOT FOUND
  if (!product) {
    notFound();
  }

  const messages: Record<string, string> = {
    invalid:
      "Please check the product details, pricing, image uploads, warranty breakdown and verified vehicle compatibility.",

    database:
      "Could not update this product. Please check the database connection and try again.",
  };

  return (
    <main className="min-h-screen bg-[#F6FAFC] px-5 py-10 text-[#17364E]">
      <div className="mx-auto max-w-3xl">

        {/* BACK TO ADMIN */}
        <Link
          href="/admin"
          className="text-sm font-semibold text-[#398DB9] hover:underline"
        >
          ← Back to Admin
        </Link>

        {/* PAGE HEADING */}
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight">
          Edit Battery
        </h1>

        <p className="mt-2 text-sm text-[#678093]">
          {product.brand} {product.model}
        </p>

        {/* ERROR MESSAGES */}
        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {messages[error] ||
              "Something went wrong."}
          </div>
        )}

        {/* SHARED ADMIN PRODUCT FORM */}
        <ProductForm
          key={product.id}
          action={updateProduct.bind(
            null,
            product.id
          )}
          product={product}
          vehicles={availableVehicles}
          selectedVehicleIds={savedFitments.map(
            (item) => item.vehicleId
          )}
        />

      </div>
    </main>
  );
}