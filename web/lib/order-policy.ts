export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Order placed",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered and installed",
  completed: "Completed",
  failed_delivery: "Delivery attempt unsuccessful",
  cancelled: "Cancelled",
};

export const ORDER_TRANSITIONS: Record<string, readonly string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["out_for_delivery", "cancelled"],
  out_for_delivery: ["delivered", "failed_delivery"],
  failed_delivery: ["preparing", "cancelled"],
  delivered: ["completed"],
  completed: [],
  cancelled: [],
};

export function orderStatusLabel(value: string) {
  return Object.hasOwn(ORDER_STATUS_LABELS, value) ? ORDER_STATUS_LABELS[value] : "Status under review";
}

export function canTransition(from: string, to: string) {
  return Object.hasOwn(ORDER_TRANSITIONS, from) && ORDER_TRANSITIONS[from].includes(to);
}

export function exchangeAdjustment(quantity: number, approved: number, withPaise: number, withoutPaise: number) {
  if (!Number.isSafeInteger(approved) || approved < 0 || approved > quantity || withoutPaise < withPaise) {
    throw new Error("Invalid exchange settlement.");
  }
  const difference = (quantity - approved) * (withoutPaise - withPaise);
  return {
    difference,
    lineTotal: quantity * withPaise + difference,
    status: approved === quantity ? "approved" : approved === 0 ? "rejected" : "partial",
  };
}

export function paymentStatus(paid: number, balance: number) {
  return balance === 0 ? "paid" : paid > 0 ? "partial" : "pending";
}
