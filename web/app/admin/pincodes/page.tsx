
import Link from "next/link";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { asc, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { deliveryPincodes } from "@/db/schema";

// Admin authentication
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
}

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
      .where(eq(deliveryPincodes.pinCode, pinCode));
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
    (item) => item.active
  ).length;

  const inputClass =
    "mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900";

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl">

        <Link
          href="/admin"
          className="text-sm font-semibold text-orange-600"
        >
          ← Back to Admin Dashboard
        </Link>

        <h1 className="mt-5 text-3xl font-bold">
          Delivery PIN Codes
        </h1>

        <p className="mt-2 text-slate-500">
          Manage delivery availability in Mumbai
          and Navi Mumbai.
        </p>

        {query.message && (
          <div className="mt-6 rounded-lg bg-green-50 p-4 text-green-800">
            PIN code saved or updated successfully.
          </div>
        )}

        {query.error && (
          <div
            role="alert"
            className="mt-6 rounded-lg bg-red-50 p-4 text-red-700"
          >
            {query.error === "invalid"
              ? "Enter a valid PIN code and city."
              : "Could not save your changes. Try again."}
          </div>
        )}

        {/* Statistics */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Total PIN Codes
            </p>
            <p className="mt-2 text-3xl font-bold">
              {pincodes.length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Active PIN Codes
            </p>
            <p className="mt-2 text-3xl font-bold text-green-700">
              {activeCount}
            </p>
          </div>
        </div>

        {/* Add PIN Code */}
        <section className="mt-8 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">
            Add Delivery PIN Code
          </h2>

          <form
            action={addPincode}
            className="mt-5 grid gap-4 sm:grid-cols-3"
          >
            <label className="text-sm font-medium">
              PIN Code
              <input
                name="pinCode"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                placeholder="400001"
                className={inputClass}
              />
            </label>

            <label className="text-sm font-medium">
              City
              <select
                name="city"
                required
                defaultValue="Mumbai"
                className={inputClass}
              >
                <option value="Mumbai">
                  Mumbai
                </option>
                <option value="Navi Mumbai">
                  Navi Mumbai
                </option>
              </select>
            </label>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-lg bg-orange-600 px-5 py-3 font-semibold text-white hover:bg-orange-700"
              >
                Add PIN Code
              </button>
            </div>
          </form>

          <p className="mt-4 text-xs text-slate-500">
            Adding an existing PIN code will reactivate
            it and update its assigned city.
          </p>
        </section>

        {/* PIN Code List */}
        <section className="mt-8 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">
            Manage Service Areas
          </h2>

          <div className="mt-5 space-y-3">
            {pincodes.map((item) => (
              <div
                key={item.pinCode}
                className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4"
              >
                <div>
                  <p className="text-lg font-bold">
                    {item.pinCode}
                  </p>

                  <p className="text-sm text-slate-500">
                    {item.city}
                  </p>

                  <p
                    className={`mt-2 text-sm font-semibold ${
                      item.active
                        ? "text-green-700"
                        : "text-red-600"
                    }`}
                  >
                    {item.active
                      ? "● Delivery Available"
                      : "● Delivery Disabled"}
                  </p>
                </div>

                <form action={changePincodeStatus}>
                  <input
                    type="hidden"
                    name="pinCode"
                    value={item.pinCode}
                  />

                  <input
                    type="hidden"
                    name="nextActive"
                    value={String(!item.active)}
                  />

                  <button
                    type="submit"
                    className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                      item.active
                        ? "border border-red-300 text-red-700 hover:bg-red-50"
                        : "bg-green-700 text-white hover:bg-green-800"
                    }`}
                  >
                    {item.active
                      ? "Deactivate"
                      : "Activate"}
                  </button>
                </form>
              </div>
            ))}

            {pincodes.length === 0 && (
              <p className="py-8 text-center text-slate-500">
                No delivery PIN codes added yet.
              </p>
            )}
          </div>
        </section>

      </div>
    </main>
  );
}
