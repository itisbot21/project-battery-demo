
import { AdminPage, AdminStatus, AdminTable } from "@/components/admin/admin-page";
import { ChoiceSelect } from "@/components/design/choice-field";
import { Notice } from "@/components/design/commerce-ui";
import { SubmitButton } from "@/components/design/submit-button";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, asc, eq } from "drizzle-orm";

import { requireAdmin } from "@/lib/require-admin";
import { db } from "@/db";
import { deliveryPincodes } from "@/db/schema";
import { allowedDeliveryCity } from "@/lib/serviceability";
import { serviceCity } from "@/lib/store-policy";

// Add a PIN code or reactivate an existing one
async function addPincode(formData: FormData) {
  "use server";

  await requireAdmin();

  const pinCode = String(
    formData.get("pinCode") ?? ""
  ).trim();

  const city = String(
    formData.get("city") ?? ""
  );

  if (
    !/^\d{6}$/.test(pinCode) ||
    !["Mumbai", "Navi Mumbai"].includes(city)
  ) {
    redirect("/admin/pincodes?error=invalid");
  }

  try {
    await db
      .insert(deliveryPincodes)
      .values({
        pinCode,
        city,
        active: true,
      })
      .onConflictDoUpdate({
        target: deliveryPincodes.pinCode,
        set: {
          city,
          active: true,
        },
      });
  } catch (error) {
    console.error("Could not save PIN code:", error);
    redirect("/admin/pincodes?error=database");
  }

  revalidatePath("/admin/pincodes");

  redirect("/admin/pincodes?message=saved");
}

// Activate or deactivate delivery availability
async function changePincodeStatus(formData: FormData) {
  "use server";

  await requireAdmin();

  const pinCode = String(
    formData.get("pinCode") ?? ""
  );

  const nextActive = String(
    formData.get("nextActive") ?? ""
  );

  if (
    !/^\d{6}$/.test(pinCode) ||
    !["true", "false"].includes(nextActive)
  ) {
    redirect("/admin/pincodes?error=invalid");
  }

  try {
    await db
      .update(deliveryPincodes)
      .set({
        active: nextActive === "true",
      })
      .where(and(eq(deliveryPincodes.pinCode, pinCode), nextActive === "true" ? allowedDeliveryCity() : undefined));
  } catch (error) {
    console.error("Could not update PIN code:", error);
    redirect("/admin/pincodes?error=database");
  }

  revalidatePath("/admin/pincodes");

  redirect("/admin/pincodes?message=updated");
}

export default async function PincodesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string;
    error?: string;
  }>;
}) {
  await requireAdmin();

  const query = await searchParams;

  const pincodes = await db
    .select()
    .from(deliveryPincodes)
    .orderBy(asc(deliveryPincodes.pinCode));

  const activeCount = pincodes.filter(
    (item) => item.active && serviceCity(item.city)
  ).length;

  return <AdminPage title="Delivery PINs" description={activeCount + " serviceable PINs out of " + pincodes.length + " records"}>
    <div className="grid gap-3">
      {query.message && <Notice tone="success">PIN code saved.</Notice>}
      {query.error && <Notice tone="critical">{query.error === "invalid" ? "Enter a valid PIN code and city." : "Could not save your changes. Try again."}</Notice>}
      <div className="admin-split">
        <section className="panel operations-card">
          <h2>Add delivery PIN</h2>
          <form action={addPincode}>
            <label>PIN code<input className="store-input" name="pinCode" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required /></label>
            <ChoiceSelect label="City" name="city" required placeholder="Choose a city"
              options={[{ value: "Mumbai", label: "Mumbai" }, { value: "Navi Mumbai", label: "Navi Mumbai" }]} />
            <SubmitButton primary>Save PIN code</SubmitButton>
          </form>
        </section>
        <AdminTable caption="Delivery coverage" columns={["PIN code", "City", "Status", "Action"]} empty="No delivery PINs have been added."
          rows={pincodes.map((item) => {
            const included = Boolean(serviceCity(item.city));
            const active = item.active && included;
            return { id: item.pinCode, cells: [
              <strong className="price" key="code">{item.pinCode}</strong>, item.city,
              <AdminStatus key="status" tone={active ? "success" : "neutral"}>{active ? "Active" : included ? "Inactive" : "Out of area"}</AdminStatus>,
              (item.active || included) ? <form action={changePincodeStatus} key="action">
                <input type="hidden" name="pinCode" value={item.pinCode} />
                <input type="hidden" name="nextActive" value={item.active ? "false" : "true"} />
                <SubmitButton>{item.active ? "Deactivate" : "Activate"}</SubmitButton>
              </form> : "Unavailable",
            ] };
          })} />
      </div>
    </div>
  </AdminPage>;
}
