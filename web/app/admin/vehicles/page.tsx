
import { Search } from "lucide-react";
import { AdminPage, AdminStatus } from "@/components/admin/admin-page";
import { ChoiceSelect } from "@/components/design/choice-field";
import { Notice } from "@/components/design/commerce-ui";
import { ConfirmSubmit } from "@/components/design/modal";
import { SubmitButton } from "@/components/design/submit-button";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { asc, and, eq, notExists } from "drizzle-orm";

import { db } from "@/db";
import { transact } from "@/db/transaction";
import {
    vehicles,
    batteryCompatibility,
} from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";



type VehicleInput = {
    type: "Car" | "Bike";
    brand: string;
    model: string;
    variant: string;
};

function parseVehicle(
    formData: FormData
): VehicleInput | null {
    const type = formData.get("type");
    const brand = formData.get("brand");
    const model = formData.get("model");
    const variant = formData.get("variant");

    if (
        (type !== "Car" && type !== "Bike") ||
        typeof brand !== "string" ||
        typeof model !== "string" ||
        typeof variant !== "string"
    ) {
        return null;
    }

    const cleanBrand = brand.trim();
    const cleanModel = model.trim();
    const cleanVariant = variant.trim();

    if (
        cleanBrand.length < 2 ||
        cleanBrand.length > 80 ||
        cleanModel.length < 1 ||
        cleanModel.length > 120 ||
        cleanVariant.length < 1 ||
        cleanVariant.length > 120
    ) {
        return null;
    }

    return {
        type,
        brand: cleanBrand,
        model: cleanModel,
        variant: cleanVariant,
    };
}

function parseId(formData: FormData): number | null {
    const raw = formData.get("vehicleId");

    if (
        typeof raw !== "string" ||
        !/^[1-9]\d*$/.test(raw)
    ) {
        return null;
    }

    const id = Number(raw);

    return Number.isSafeInteger(id) ? id : null;
}

// ADD VEHICLE
async function addVehicle(formData: FormData) {
    "use server";

    await requireAdmin();

    const data = parseVehicle(formData);

    if (!data) {
        redirect("/admin/vehicles?error=invalid");
    }

    let result: "created" | "duplicate" | "database" =
        "database";

    try {
        const inserted = await db
            .insert(vehicles)
            .values(data)
            .onConflictDoNothing()
            .returning({ id: vehicles.id });

        result =
            inserted.length > 0 ? "created" : "duplicate";
    } catch (error) {
        console.error("Vehicle creation failed:", error);
    }

    if (result !== "created") {
        redirect(`/admin/vehicles?error=${result}`);
    }

    revalidatePath("/admin/vehicles");
    revalidatePath("/admin/products/new");

    redirect("/admin/vehicles?message=created");
}

// UPDATE AN UNUSED VEHICLE
async function updateVehicle(formData: FormData) {
    "use server";

    await requireAdmin();

    const id = parseId(formData);
    const data = parseVehicle(formData);

    if (!id || !data) {
        redirect("/admin/vehicles?error=invalid");
    }

    let updated = false;

    try {
        // Do not silently change a vehicle already
        // linked to any battery.
        const result = await transact(async (tx) => {
            await tx.select({ id: vehicles.id }).from(vehicles).where(eq(vehicles.id, id)).for("update");
            return tx.update(vehicles)
            .set(data)
            .where(
                and(
                    eq(vehicles.id, id),
                    notExists(
                        tx
                            .select({
                                id: batteryCompatibility.id,
                            })
                            .from(batteryCompatibility)
                            .where(
                                eq(
                                    batteryCompatibility.vehicleId,
                                    vehicles.id
                                )
                            )
                    )
                )
            )
            .returning({ id: vehicles.id });
        });

        updated = result.length > 0;
    } catch (error) {
        console.error("Vehicle update failed:", error);

        redirect("/admin/vehicles?error=database");
    }

    if (!updated) {
        redirect("/admin/vehicles?error=locked");
    }

    revalidatePath("/admin/vehicles");
    revalidatePath("/admin/products/new");

    redirect("/admin/vehicles?message=updated");
}

// DELETE AN UNUSED VEHICLE
async function deleteVehicle(formData: FormData) {
    "use server";

    await requireAdmin();

    const id = parseId(formData);

    if (!id) {
        redirect("/admin/vehicles?error=invalid");
    }

    let deleted = false;

    try {
        // Important: the schema uses cascading
        // compatibility relationships.
        // This condition prevents deleting an
        // assigned vehicle and its fitments.
        const result = await transact(async (tx) => {
            await tx.select({ id: vehicles.id }).from(vehicles).where(eq(vehicles.id, id)).for("update");
            return tx.delete(vehicles)
            .where(
                and(
                    eq(vehicles.id, id),
                    notExists(
                        tx
                            .select({
                                id: batteryCompatibility.id,
                            })
                            .from(batteryCompatibility)
                            .where(
                                eq(
                                    batteryCompatibility.vehicleId,
                                    vehicles.id
                                )
                            )
                    )
                )
            )
            .returning({ id: vehicles.id });
        });

        deleted = result.length > 0;
    } catch (error) {
        console.error("Vehicle deletion failed:", error);

        redirect("/admin/vehicles?error=database");
    }

    if (!deleted) {
        redirect("/admin/vehicles?error=locked");
    }

    revalidatePath("/admin/vehicles");
    revalidatePath("/admin/products/new");

    redirect("/admin/vehicles?message=deleted");
}

// ADMIN PAGE
export default async function VehiclesAdminPage({
    searchParams,
}: {
    searchParams: Promise<{
        message?: string;
        q?: string;
        error?: string;
    }>;
}) {
    await requireAdmin();

    const query = await searchParams;

    const [vehicleList, assignedFitments] =
        await Promise.all([
            db
                .select()
                .from(vehicles)
                .orderBy(
                    asc(vehicles.type),
                    asc(vehicles.brand),
                    asc(vehicles.model),
                    asc(vehicles.variant)
                ),

            db
                .select({
                    vehicleId: batteryCompatibility.vehicleId,
                })
                .from(batteryCompatibility),
        ]);

    const assignedIds = new Set(
        assignedFitments.map((item) => item.vehicleId)
    );

    const carCount = vehicleList.filter(
        (vehicle) => vehicle.type === "Car"
    ).length;

    const bikeCount = vehicleList.filter(
        (vehicle) => vehicle.type === "Bike"
    ).length;

    const messages: Record<string, string> = {
        created: "Vehicle added successfully.",
        updated: "Vehicle updated successfully.",
        deleted: "Vehicle removed successfully.",
    };

    const errors: Record<string, string> = {
        invalid: "Please check the vehicle information.",
        duplicate:
            "This manufacturer, model and variant already exist.",
        locked:
            "This vehicle is assigned to a battery or no longer exists. Remove its battery assignments before editing or deleting it.",
        database:
            "Could not save the changes. Please try again.",
    };

    const search = typeof query.q === "string" ? query.q.trim().slice(0, 120) : "";
    const records = vehicleList.filter((vehicle) =>
      [vehicle.type, vehicle.brand, vehicle.model, vehicle.variant].join(" ").toLowerCase().includes(search.toLowerCase())
    );

    return <AdminPage title="Vehicles" description={carCount + " car variants · " + bikeCount + " bike variants"}>
      <div className="grid gap-3">
        {query.message && <Notice tone="success">{messages[query.message] ?? "Vehicle list updated."}</Notice>}
        {query.error && <Notice tone="critical">{errors[query.error] ?? "Could not save the changes."}</Notice>}
        <div className="admin-split">
          <section className="panel operations-card">
            <h2>Add vehicle</h2>
            <form action={addVehicle}>
              <VehicleFields />
              <SubmitButton primary>Add vehicle</SubmitButton>
            </form>
          </section>
          <section className="panel operations-card">
            <h2>Vehicle directory</h2>
            <form method="get">
              <div className="grid items-end gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                <label>Find a vehicle<span className="search-field"><Search size={17} aria-hidden="true" />
                  <input className="store-input" name="q" type="search" defaultValue={search} placeholder="Make, model or variant" />
                </span></label>
                <button className="shop-button">Search</button>
              </div>
            </form>
            {!records.length && <Notice>No matching vehicles.</Notice>}
            <div>{records.map((vehicle) => {
              const locked = assignedIds.has(vehicle.id);
              return <article className="admin-record" key={vehicle.id}>
                <div className="admin-record-heading">
                  <div><strong>{vehicle.brand} {vehicle.model}</strong><p className="muted">{vehicle.type} · {vehicle.variant}</p></div>
                  <AdminStatus tone={locked ? "active" : "neutral"}>{locked ? "Assigned to a battery" : "Unassigned"}</AdminStatus>
                </div>
                {!locked && <details>
                  <summary>Edit vehicle</summary>
                  <div className="grid gap-2">
                    <form action={updateVehicle}>
                      <input type="hidden" name="vehicleId" value={vehicle.id} />
                      <VehicleFields vehicle={vehicle} />
                      <SubmitButton>Save vehicle</SubmitButton>
                    </form>
                    <form action={deleteVehicle}>
                      <input type="hidden" name="vehicleId" value={vehicle.id} />
                      <ConfirmSubmit title="Remove this vehicle?" description="This unassigned variant will be removed from the vehicle directory." confirmLabel="Remove vehicle">Remove vehicle</ConfirmSubmit>
                    </form>
                  </div>
                </details>}
              </article>;
            })}</div>
          </section>
        </div>
      </div>
    </AdminPage>;
}

function VehicleFields({ vehicle }: { vehicle?: typeof vehicles.$inferSelect }) {
  return <div className="admin-field-grid">
    <ChoiceSelect label="Vehicle type" name="type" defaultValue={vehicle?.type ?? "Car"} required
      options={[{ value: "Car", label: "Car" }, { value: "Bike", label: "Bike" }]} />
    <label>Manufacturer<input className="store-input" name="brand" defaultValue={vehicle?.brand} required minLength={2} maxLength={80} /></label>
    <label>Model<input className="store-input" name="model" defaultValue={vehicle?.model} required maxLength={120} /></label>
    <label>Variant / fuel type<input className="store-input" name="variant" defaultValue={vehicle?.variant} required maxLength={120} /></label>
  </div>;
}
