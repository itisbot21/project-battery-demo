
"use server";

import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { and, asc, eq, inArray } from "drizzle-orm";

import { requireAdmin } from "@/lib/require-admin";
import { parseProductDraft } from "@/lib/admin-product-data";
import { db } from "@/db";
import { BATTERY_CATEGORIES } from "@/lib/store-policy";
import {
    batteryCompatibility,
    products,
    vehicles,
} from "@/db/schema";

class InvalidFitment extends Error { }
class StockChanged extends Error { }

// VALIDATE SELECTED VEHICLES
function assertVehicleIds(
    matched: { id: number; type: string }[],
    category: string,
    ids: number[]
) {
    if (ids.length === 0) return;

    if (category !== "Car" && category !== "Bike") {
        throw new InvalidFitment();
    }

    if (
        matched.length !== ids.length ||
        matched.some((vehicle) => vehicle.type !== category)
    ) {
        throw new InvalidFitment();
    }
}

// CREATE A TRANSACTION-CAPABLE DATABASE CONNECTION
function transactionPool() {
    const url = process.env.DATABASE_URL;

    if (!url) {
        throw new Error("Database is not configured");
    }

    const pool = new Pool({
        connectionString: url,
    });

    return {
        pool,
        transactionalDb: drizzle({ client: pool }),
    };
}

// REFRESH PRODUCT DATA AFTER CHANGES
function refresh() {
    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath("/api/products");
}

// CREATE NEW PRODUCT
export async function createProduct(
    formData: FormData
) {
    await requireAdmin();

    const parsed = parseProductDraft(formData);

    if (!parsed) {
        redirect("/admin/products/new?error=invalid");
    }

    const { draft, vehicleIds } = parsed;

    // GENERATE PRODUCT URL SLUG
    const slug = `${draft.brand}-${draft.model}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    if (!slug) {
        redirect("/admin/products/new?error=invalid");
    }

    let status:
        | "created"
        | "duplicate"
        | "invalid"
        | "database" = "database";

    let connection:
        | ReturnType<typeof transactionPool>
        | null = null;

    try {
        connection = transactionPool();

        status =
            await connection.transactionalDb.transaction(
                async (tx) => {
                    // CHECK VERIFIED VEHICLE IDS
                    if (vehicleIds.length) {
                        const matched = await tx
                            .select({
                                id: vehicles.id,
                                type: vehicles.type,
                            })
                            .from(vehicles)
                            .where(
                                inArray(vehicles.id, vehicleIds)
                            ).orderBy(asc(vehicles.id)).for("share");

                        assertVehicleIds(
                            matched,
                            draft.category,
                            vehicleIds
                        );
                    }

                    // INSERT PRODUCT
                    const inserted = await tx
                        .insert(products)
                        .values({
                            slug,
                            ...draft,
                        })
                        .onConflictDoNothing()
                        .returning({
                            id: products.id,
                        });

                    if (inserted.length === 0) {
                        return "duplicate" as const;
                    }

                    // INSERT VERIFIED COMPATIBILITY
                    if (vehicleIds.length > 0) {
                        await tx
                            .insert(batteryCompatibility)
                            .values(
                                vehicleIds.map((vehicleId) => ({
                                    productId: inserted[0].id,
                                    vehicleId,
                                }))
                            );
                    }

                    return "created" as const;
                }
            );
    } catch (error) {
        if (error instanceof InvalidFitment) {
            status = "invalid";
        } else {
            console.error(
                "Product creation failed",
                error
            );
        }
    } finally {
        if (connection) {
            await connection.pool.end();
        }
    }

    if (status !== "created") {
        redirect(
            `/admin/products/new?error=${status}`
        );
    }

    refresh();
    redirect("/admin?created=1");
}

// UPDATE EXISTING PRODUCT
export async function updateProduct(
    productId: number,
    originalStock: number,
    formData: FormData
) {
    await requireAdmin();

    if (
        !Number.isSafeInteger(productId) ||
        productId <= 0
    ) {
        notFound();
    }

    const path =
        `/admin/products/${productId}/edit`;

    // LOAD EXISTING PRODUCT
    const [existing] = await db
        .select()
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);

    if (!existing) {
        notFound();
    }

    const parsed = parseProductDraft(
        formData,
        existing.category,
        existing.imageUrls
    );

    if (!parsed) {
        redirect(`${path}?error=invalid`);
    }

    const { draft, vehicleIds } = parsed;

    let status:
        | "updated"
        | "stock"
        | "invalid"
        | "database" = "database";

    let connection:
        | ReturnType<typeof transactionPool>
        | null = null;

    try {
        connection = transactionPool();

        await connection.transactionalDb.transaction(
            async (tx) => {
                // VALIDATE VEHICLE COMPATIBILITY
                if (vehicleIds.length) {
                    const matched = await tx
                        .select({
                            id: vehicles.id,
                            type: vehicles.type,
                        })
                        .from(vehicles)
                        .where(
                            inArray(
                                vehicles.id,
                                vehicleIds
                            )
                        ).orderBy(asc(vehicles.id)).for("share");

                    assertVehicleIds(
                        matched,
                        draft.category,
                        vehicleIds
                    );
                }

                const { stock, ...fields } = draft;
                const stockChanged = stock !== originalStock;
                const updated = await tx
                    .update(products)
                    .set({ ...fields, stock: stockChanged ? stock : undefined })
                    .where(and(eq(products.id, productId), stockChanged ? eq(products.stock, originalStock) : undefined))
                    .returning({
                        id: products.id,
                    });

                if (updated.length === 0) throw new StockChanged();
                if (!BATTERY_CATEGORIES.some((category) => category === draft.category)) return;

                // REMOVE PREVIOUS COMPATIBILITY
                await tx
                    .delete(batteryCompatibility)
                    .where(
                        eq(
                            batteryCompatibility.productId,
                            productId
                        )
                    );

                // SAVE NEW COMPATIBILITY
                if (vehicleIds.length > 0) {
                    await tx
                        .insert(batteryCompatibility)
                        .values(
                            vehicleIds.map((vehicleId) => ({
                                productId,
                                vehicleId,
                            }))
                        );
                }
            }
        );

        status = "updated";
    } catch (error) {
        if (error instanceof StockChanged) {
            status = "stock";
        } else if (error instanceof InvalidFitment) {
            status = "invalid";
        } else {
            console.error(
                "Product update failed",
                error
            );
        }
    } finally {
        if (connection) {
            await connection.pool.end();
        }
    }

    if (status !== "updated") {
        redirect(
            `${path}?error=${status}`
        );
    }

    refresh();
    redirect("/admin?updated=1");
}
