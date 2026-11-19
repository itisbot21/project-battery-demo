import { db } from "@/db";
import { deliveryPincodes } from "@/db/schema";
import { serviceablePin } from "@/lib/serviceability";
import { serviceCity } from "@/lib/store-policy";

export async function GET(request: Request) {
  const pin = new URL(request.url).searchParams.get("pin")?.trim() ?? "";
  if (!/^\d{6}$/.test(pin)) {
    return Response.json({ error: "Enter a valid 6-digit PIN code." }, { status: 400 });
  }

  try {
    const [match] = await db.select({ city: deliveryPincodes.city }).from(deliveryPincodes)
      .where(serviceablePin(pin)).limit(1);
    const city = match && serviceCity(match.city);
    return Response.json({ serviceable: Boolean(city), city: city ?? null },
      { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Unable to check delivery availability." }, { status: 503 });
  }
}
