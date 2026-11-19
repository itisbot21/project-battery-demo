import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { storeSettings } from "@/db/schema";
import { InfoPage } from "@/components/layout/info-page";

export const metadata: Metadata = { title: "Customer support | Project Battery", alternates: { canonical: "/contact" } };

async function SupportDetails() {
  await connection();
  let settings: typeof storeSettings.$inferSelect | undefined;
  try { [settings] = await db.select().from(storeSettings).where(eq(storeSettings.id, 1)); }
  catch { return <p>Support contact details are temporarily unavailable.</p>; }
  return <>
    {settings?.serviceMessage && <p>{settings.serviceMessage}</p>}
    {settings?.supportPhone && <p>Call <a className="text-link" href={"tel:" + settings.supportPhone}>{settings.supportPhone}</a></p>}
    {settings?.supportEmail && <p>Email <a className="text-link" href={"mailto:" + settings.supportEmail}>{settings.supportEmail}</a></p>}
    {!settings?.supportPhone && !settings?.supportEmail && <p>Direct support contact details have yet to be published. If you have placed an order, our team will call the number you provided to confirm delivery.</p>}
  </>;
}

export default function Contact() {
  return <InfoPage title="Customer support">
    <Suspense fallback={<p role="status">Loading contact details…</p>}><SupportDetails /></Suspense>
    <p>Have an order? <Link className="text-link" href="/track-order">Open order tracking</Link> with your private link.</p>
    <p>Choosing a battery? <Link className="text-link" href="/#battery-finder">Check your exact vehicle variant</Link> for verified fitment.</p>
  </InfoPage>;
}
