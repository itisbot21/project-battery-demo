import { and, eq, sql } from "drizzle-orm";
import { deliveryPincodes } from "@/db/schema";

export function serviceablePin(pin: string) {
  return and(eq(deliveryPincodes.pinCode, pin), eq(deliveryPincodes.active, true),
    allowedDeliveryCity());
}

export function allowedDeliveryCity() {
  return sql`lower(trim(regexp_replace(${deliveryPincodes.city}, '[[:space:]]+', ' ', 'g'))) in ('mumbai', 'navi mumbai')`;
}
