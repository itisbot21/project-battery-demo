
import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Our battery products
export const products = pgTable("products", {
  id: serial("id").primaryKey(),

  slug: text("slug").notNull().unique(),

  brand: text("brand").notNull(),

  model: text("model").notNull(),

  category: text("category").notNull(),

  capacityAh: integer("capacity_ah"),

  warrantyMonths: integer("warranty_months"),

  // All prices include applicable GST.
  // We store amounts in paise to avoid rounding errors.
  mrpPaise: integer("mrp_paise").notNull(),

  withoutExchangePaise: integer(
    "without_exchange_paise"
  ).notNull(),

  withExchangePaise: integer(
    "with_exchange_paise"
  ).notNull(),

  stock: integer("stock").notNull().default(0),

  active: boolean("active").notNull().default(true),

  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
});

// Vehicle information
export const vehicles = pgTable(
  "vehicles",
  {
    id: serial("id").primaryKey(),

    type: text("type").notNull(),

    brand: text("brand").notNull(),

    model: text("model").notNull(),

    variant: text("variant").notNull(),
  },
  (table) => [
    uniqueIndex("vehicle_unique_idx").on(
      table.type,
      table.brand,
      table.model,
      table.variant
    ),
  ]
);

// Verified product-to-vehicle matches
export const batteryCompatibility = pgTable(
  "battery_compatibility",
  {
    id: serial("id").primaryKey(),

    productId: integer("product_id")
      .notNull()
      .references(() => products.id, {
        onDelete: "cascade",
      }),

    vehicleId: integer("vehicle_id")
      .notNull()
      .references(() => vehicles.id, {
        onDelete: "cascade",
      }),
  },
  (table) => [
    uniqueIndex("battery_vehicle_unique_idx").on(
      table.productId,
      table.vehicleId
    ),
  ]
);


 // Delivery PIN codes managed by the admin
 export const deliveryPincodes = pgTable(
   "delivery_pincodes",
   {
     pinCode: text("pin_code").primaryKey(),

     city: text("city").notNull(),

     active: boolean("active")
       .notNull()
       .default(true),

     createdAt: timestamp("created_at")
       .notNull()
       .defaultNow(),
   }
 );
