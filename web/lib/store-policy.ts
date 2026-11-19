export const BATTERY_CATEGORIES = ["Car", "Bike"] as const;
export const SERVICE_CITIES = ["Mumbai", "Navi Mumbai"] as const;
export const MAX_ORDER_PAISE = 2_000_000_000;

export type BatteryCategory = (typeof BATTERY_CATEGORIES)[number];
export function batteryCategory(value: string | undefined): BatteryCategory | undefined {
  return BATTERY_CATEGORIES.find((category) => category.toLowerCase() === value?.trim().toLowerCase());
}
export function serviceCity(value: string) {
  return SERVICE_CITIES.find((city) => city.toLowerCase() === value.trim().replace(/\s+/g, " ").toLowerCase());
}
export function positiveId(value: string | undefined) {
  if (!value || !/^[1-9]\d{0,9}$/.test(value)) return undefined;
  const id = Number(value);
  return id <= 2_147_483_647 ? id : undefined;
}
export function normalize(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}
export function manufacturerSlug(value: string) {
  return normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
