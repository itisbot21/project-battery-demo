import { and, asc, desc, eq, exists, gte, inArray, lte, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { batteryCompatibility, products, vehicles } from "@/db/schema";
import { BATTERY_CATEGORIES, normalize, type BatteryCategory } from "@/lib/store-policy";

export const PAGE_SIZE = 24;
export const sellableProducts = and(eq(products.active, true), inArray(products.category, BATTERY_CATEGORIES));
export type CatalogVehicle = typeof vehicles.$inferSelect;

export function listVehicles(type?: BatteryCategory) {
  return db.select().from(vehicles)
    .where(type ? eq(vehicles.type, type) : inArray(vehicles.type, BATTERY_CATEGORIES))
    .orderBy(asc(vehicles.type), asc(vehicles.brand), asc(vehicles.model), asc(vehicles.variant), asc(vehicles.id));
}

export async function listBrands({ inStock = false } = {}) {
  const rows = await db.selectDistinct({ brand: products.brand }).from(products)
    .where(inStock ? and(sellableProducts, gte(products.stock, 1)) : sellableProducts)
    .orderBy(asc(products.brand));
  return [...new Map(rows.filter(({ brand }) => normalize(brand)).map(({ brand }) => [normalize(brand), brand.trim()])).values()];
}

type CatalogFilters = {
  category?: BatteryCategory;
  brand?: string;
  search?: string;
  vehicleId?: number;
  capacity?: number;
  warranty?: number;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: string;
  page?: number;
};

export function listCatalog(filters: CatalogFilters = {}, limit = PAGE_SIZE + 1) {
  const conditions: (SQL | undefined)[] = [sellableProducts];
  const brand = filters.brand && normalize(filters.brand);
  const search = filters.search && normalize(filters.search);

  if (filters.category) conditions.push(eq(products.category, filters.category));
  if (brand) conditions.push(sql`lower(trim(regexp_replace(${products.brand}, '[[:space:]]+', ' ', 'g'))) = ${brand}`);
  if (search) conditions.push(sql`position(${search} in lower(concat_ws(' ', trim(${products.brand}), trim(${products.model})))) > 0`);
  if (filters.capacity) conditions.push(eq(products.capacityAh, filters.capacity));
  if (filters.warranty) conditions.push(gte(products.warrantyMonths, filters.warranty));
  if (filters.minPrice !== undefined) conditions.push(gte(products.withoutExchangePaise, filters.minPrice));
  if (filters.maxPrice !== undefined) conditions.push(lte(products.withoutExchangePaise, filters.maxPrice));
  if (filters.inStock) conditions.push(gte(products.stock, 1));
  if (filters.vehicleId !== undefined) {
    conditions.push(exists(db.select({ id: batteryCompatibility.id }).from(batteryCompatibility)
      .innerJoin(vehicles, eq(vehicles.id, batteryCompatibility.vehicleId))
      .where(and(
        eq(batteryCompatibility.productId, products.id),
        eq(batteryCompatibility.vehicleId, filters.vehicleId),
        eq(vehicles.type, products.category),
      ))));
  }

  const sort = filters.sort === "price-asc" ? asc(products.withoutExchangePaise)
    : filters.sort === "price-desc" ? desc(products.withoutExchangePaise)
    : filters.sort === "warranty" ? sql`${products.warrantyMonths} DESC NULLS LAST`
    : sql`(${products.stock} > 0) DESC`;
  const relevance = search ? sql`(lower(trim(${products.model})) = ${search}) DESC` : sort;

  return db.select().from(products).where(and(...conditions))
    .orderBy(relevance, sort, asc(products.brand), asc(products.model), asc(products.id))
    .limit(limit).offset(((filters.page ?? 1) - 1) * PAGE_SIZE);
}

export async function catalogCapacities() {
  const rows = await db.selectDistinct({ value: products.capacityAh }).from(products)
    .where(and(sellableProducts, gte(products.capacityAh, 1))).orderBy(asc(products.capacityAh));
  return rows.flatMap(({ value }) => value === null ? [] : [value]);
}
