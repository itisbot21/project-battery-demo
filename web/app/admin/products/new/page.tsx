
import Link from "next/link";
import { AdminPage } from "@/components/admin/admin-page";
import { Notice } from "@/components/design/commerce-ui";

import { requireAdmin } from "@/lib/require-admin";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { ProductForm } from "@/components/admin/product-form";
import { createProduct } from "../actions";


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

  return <AdminPage title="Add battery" actions={<Link className="shop-button" href="/admin/products">Back to products</Link>}>
    {error && <Notice tone="critical">{messages[error] || "Something went wrong."}</Notice>}
    <ProductForm action={createProduct} uploadsEnabled={Boolean(process.env.BLOB_READ_WRITE_TOKEN)} vehicles={availableVehicles} />
  </AdminPage>;
}
