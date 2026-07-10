export function formatNaira(n: number): string {
  return "₦" + n.toLocaleString("en-NG");
}

export function isRestaurantOpen(
  opens_at: string,
  closes_at: string,
  is_open_override: boolean | null | undefined,
  now = new Date(),
): boolean {
  if (is_open_override === false) return false;
  if (is_open_override === true) return true;
  // Compare Africa/Lagos time (UTC+1, no DST)
  const lagosMinutes = ((now.getUTCHours() + 1) % 24) * 60 + now.getUTCMinutes();
  const [oh, om] = opens_at.split(":").map(Number);
  const [ch, cm] = closes_at.split(":").map(Number);
  const openMin = oh * 60 + om;
  const closeMin = ch * 60 + cm;
  if (closeMin > openMin) return lagosMinutes >= openMin && lagosMinutes < closeMin;
  // wraps past midnight
  return lagosMinutes >= openMin || lagosMinutes < closeMin;
}

export const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pending payment",
  payment_confirmed: "Payment confirmed",
  awaiting_restaurant_acceptance: "Awaiting restaurant",
  accepted_by_restaurant: "Accepted",
  preparing: "Preparing",
  ready_for_pickup: "Ready for pickup",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const STATUS_ORDER = [
  "pending_payment",
  "payment_confirmed",
  "awaiting_restaurant_acceptance",
  "accepted_by_restaurant",
  "preparing",
  "ready_for_pickup",
  "out_for_delivery",
  "delivered",
] as const;
