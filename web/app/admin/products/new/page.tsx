
import Link from "next/link";

import { requireAdmin } from "@/lib/require-admin";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { ProductForm } from "@/components/admin/product-form";
import { createProduct } from "../actions";

export const instant = false;

export default async function AddProductPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // Only admins can access this page.
  await requireAdmin();

  const [{ error }, availableVehicles] = await Promise.all([
    searchParams,
    db
      .select()
      .from(vehicles)
      .orderBy(
        vehicles.type,
        vehicles.brand,
        vehicles.model,
        vehicles.variant
      ),
  ]);

  const messages: Record<string, string> = {
    invalid:
      "Please check the product fields, image uploads, warranty breakdown, and verified vehicle choices.",

    duplicate:
      "A product with this brand and model already exists.",

    database:
      "Could not save this product. Please try again.",
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
          Add New Battery
        </h1>

        <p className="mt-2 text-sm text-[#678093]">
          Create a new car or bike battery listing
          for Project Battery.
        </p>

        {/* SERVER VALIDATION ERRORS */}
        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {messages[error] || "Something went wrong."}
          </div>
        )}

        {/* SHARED PRODUCT FORM */}
        <ProductForm
          action={createProduct}
          vehicles={availableVehicles}
        />
      </div>
    </main>
  );
}