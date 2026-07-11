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
  rider_arrived_at_restaurant: "Rider at restaurant",
  out_for_delivery: "Out for delivery",
  rider_arrived_at_delivery: "Rider at delivery",
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
  "rider_arrived_at_restaurant",
  "out_for_delivery",
  "rider_arrived_at_delivery",
  "delivered",
] as const;

export function optimizeImageUrl(url: string | null | undefined, width: number = 300): string {
  if (!url) return "";
  if (url.includes("unsplash.com")) {
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set("w", width.toString());
      urlObj.searchParams.set("auto", "format,compress");
      urlObj.searchParams.set("q", "50"); // Maximum compression for fastest loading
      urlObj.searchParams.set("fit", "crop");
      return urlObj.toString();
    } catch {
      return url;
    }
  }

  // Optimize Supabase Storage images if they exist
  if (url.includes("supabase.co/storage/v1/object/public")) {
    try {
      const transformedUrl = url.replace(
        "/storage/v1/object/public/",
        "/storage/v1/render/image/public/"
      );
      const urlObj = new URL(transformedUrl);
      urlObj.searchParams.set("width", width.toString());
      urlObj.searchParams.set("quality", "50");
      urlObj.searchParams.set("format", "webp");
      return urlObj.toString();
    } catch {
      return url;
    }
  }

  return url;
}
