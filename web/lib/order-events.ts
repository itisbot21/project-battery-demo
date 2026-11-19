import type { StoreTransaction } from "@/db/transaction";
import { notificationOutbox, orderEvents } from "@/db/schema";

export async function recordOrderEvent(
  tx: StoreTransaction,
  event: typeof orderEvents.$inferInsert,
  notify = false,
) {
  const [saved] = await tx.insert(orderEvents).values(event).returning({ id: orderEvents.id });
  if (notify) {
    await tx.insert(notificationOutbox).values(
      ["whatsapp", "sms"].map((channel) => ({ eventId: saved.id, channel })),
    );
  }
}
