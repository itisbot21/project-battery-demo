import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { storeSettings } from "@/db/schema";
import { AdminPage } from "@/components/admin/admin-page";
import { Notice } from "@/components/design/commerce-ui";
import { SubmitButton } from "@/components/design/submit-button";
import { requireAdmin } from "@/lib/require-admin";


async function saveSettings(form: FormData) {
  "use server";
  await requireAdmin();
  const supportPhone = String(form.get("phone") ?? "").trim();
  const supportEmail = String(form.get("email") ?? "").trim();
  const serviceMessage = String(form.get("message") ?? "").trim();
  if ((supportPhone && !/^\+?[0-9]{8,15}$/.test(supportPhone)) ||
    (supportEmail && (supportEmail.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail))) ||
    serviceMessage.length > 300) redirect("/admin/settings?error=invalid");
  try {
    const settings = { supportPhone: supportPhone || null, supportEmail: supportEmail || null, serviceMessage: serviceMessage || null };
    await db.insert(storeSettings).values({ id: 1, ...settings }).onConflictDoUpdate({ target: storeSettings.id, set: settings });
  } catch { redirect("/admin/settings?error=save"); }
  redirect("/admin/settings?saved=1");
}

export default async function Settings({ searchParams }: PageProps<"/admin/settings">) {
  await requireAdmin();
  const query = await searchParams;
  const [settings] = await db.select().from(storeSettings).where(eq(storeSettings.id, 1));
  return <AdminPage title="Store settings" description="Manage the support details shown to customers.">
    <div className="grid max-w-2xl gap-4">
      <section className="panel operations-card"><h2>Public support details</h2>
        {query.saved === "1" && <Notice tone="success">Settings saved.</Notice>}
        {query.error && <Notice tone="critical">{query.error === "invalid" ? "Check the phone number, email and service message." : "Unable to save settings."}</Notice>}
        <form action={saveSettings}>
          <label>Support phone<input className="store-input" type="tel" name="phone" autoComplete="tel" maxLength={16} defaultValue={settings?.supportPhone ?? ""} /></label>
          <label>Support email<input className="store-input" type="email" name="email" maxLength={200} defaultValue={settings?.supportEmail ?? ""} /></label>
          <label>Customer service message<textarea className="store-input" name="message" maxLength={300} defaultValue={settings?.serviceMessage ?? ""} /></label>
          <SubmitButton primary>Save settings</SubmitButton>
        </form>
      </section>
      <section className="panel operations-card"><h2>Payments and notifications</h2>
        <p>Cash on delivery is active.</p><p>WhatsApp and SMS status updates are awaiting provider setup.</p>
      </section>
    </div>
  </AdminPage>;
}
