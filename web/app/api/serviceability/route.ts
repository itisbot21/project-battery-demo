
import { db } from "@/db";
import { deliveryPincodes } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const pin = searchParams.get("pin")?.trim() ?? "";

  if (!/^\d{6}$/.test(pin)) {
    return Response.json(
      { error: "Enter a valid 6-digit PIN code." },
      { status: 400 }
    );
  }

  try {
    const [match] = await db
      .select({
        city: deliveryPincodes.city,
      })
      .from(deliveryPincodes)
      .where(
        and(
          eq(deliveryPincodes.pinCode, pin),
          eq(deliveryPincodes.active, true)
        )
      )
      .limit(1);

    return Response.json(
      {
        serviceable: Boolean(match),
        city: match?.city ?? null,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("PIN code check failed:", error);

    return Response.json(
      { error: "Unable to check delivery availability." },
      { status: 503 }
    );
  }
}
