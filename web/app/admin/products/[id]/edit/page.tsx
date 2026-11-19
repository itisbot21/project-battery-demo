
import Link from "next/link";
import { AdminPage } from "@/components/admin/admin-page";
import { Notice } from "@/components/design/commerce-ui";
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

    stock: "Stock changed since this form was opened. Review the current quantity and make your changes again.",
    database:
      "Could not update this product. Please check the database connection and try again.",
  };

  return <AdminPage title="Edit battery" description={product.brand + " " + product.model}
    actions={<Link className="shop-button" href="/admin/products">Back to products</Link>}>
    {error && <Notice tone="critical">{messages[error] || "Something went wrong."}</Notice>}
    <ProductForm key={product.id} action={updateProduct.bind(null, product.id, product.stock)}
      product={product} uploadsEnabled={Boolean(process.env.BLOB_READ_WRITE_TOKEN)}
      vehicles={availableVehicles} selectedVehicleIds={savedFitments.map((item) => item.vehicleId)} />
  </AdminPage>;
}
