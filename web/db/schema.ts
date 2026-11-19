
import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// PRODUCTS
export const products = pgTable("products", {
  id: serial("id").primaryKey(),

  slug: text("slug").notNull().unique(),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  category: text("category").notNull(),

  capacityAh: integer("capacity_ah"),
  warrantyMonths: integer("warranty_months"),

  // PRODUCT DETAIL PAGE CONTENT
  description: text("description"),

  // First image is the main product image
  imageUrls: jsonb("image_urls")
    .$type<string[]>()
    .notNull()
    .default([]),

  features: jsonb("features")
    .$type<string[]>()
    .notNull()
    .default([]),

  specifications: jsonb("specifications")
    .$type<Record<string, string>>()
    .notNull()
    .default({}),

  // WARRANTY BREAKDOWN
  warrantyFreeMonths: integer(
    "warranty_free_months"
  ),

  warrantyProRataMonths: integer(
    "warranty_pro_rata_months"
  ),

  // SEO
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),

  // PRICING (IN PAISE, GST INCLUDED)
  mrpPaise: integer("mrp_paise").notNull(),

  withoutExchangePaise: integer(
    "without_exchange_paise"
  ).notNull(),

  withExchangePaise: integer(
    "with_exchange_paise"
  ).notNull(),

  // INVENTORY
  stock: integer("stock").notNull().default(0),
  active: boolean("active").notNull().default(true),

  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
});

// VEHICLES
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

// VERIFIED BATTERY COMPATIBILITY
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

// DELIVERY PIN CODES
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

// CUSTOMER ORDERS
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),

  customerName: text("customer_name").notNull(),
  mobile: text("mobile").notNull(),

  address: text("address").notNull(),
  city: text("city").notNull(),
  pinCode: text("pin_code").notNull(),

  paymentMethod: text("payment_method").notNull(),

  paymentStatus: text("payment_status")
    .notNull()
    .default("pending"),

  orderStatus: text("order_status")
    .notNull()
    .default("pending"),

  totalPaise: integer("total_paise").notNull(),

  advancePercentage: integer("advance_percentage")
    .notNull()
    .default(0),

  amountDueNowPaise: integer("amount_due_now_paise")
    .notNull()
    .default(0),

  paidPaise: integer("paid_paise")
    .notNull()
    .default(0),

  balanceDuePaise: integer("balance_due_paise")
    .notNull(),
  finalTotalPaise: integer("final_total_paise"),
  trackingTokenHash: text("tracking_token_hash").unique(),
  requestHash: text("request_hash"),
  stockRestoredAt: timestamp("stock_restored_at"),

  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
});

// ORDER ITEMS
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),

  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, {
      onDelete: "cascade",
    }),

  productId: integer("product_id")
    .notNull()
    .references(() => products.id, {
      onDelete: "restrict",
    }),

  productBrand: text("product_brand").notNull(),
  productModel: text("product_model").notNull(),

  quantity: integer("quantity").notNull(),

  exchangeSelected: boolean("exchange_selected")
    .notNull()
    .default(false),

  exchangeStatus: text("exchange_status")
    .notNull()
    .default("pending"),

  unitPricePaise: integer("unit_price_paise")
    .notNull(),

  withoutExchangeUnitPricePaise: integer(
    "without_exchange_unit_price_paise"
  ).notNull(),

  lineTotalPaise: integer("line_total_paise")
    .notNull(),
  withExchangeUnitPricePaise: integer("with_exchange_unit_price_paise"),
  finalLineTotalPaise: integer("final_line_total_paise"),
  approvedExchangeQuantity: integer("approved_exchange_quantity"),
});

export const orderEvents = pgTable("order_events", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "restrict" }),
  actorId: text("actor_id"),
  kind: text("kind").notNull(),
  details: jsonb("details").$type<Record<string, string | number | null>>().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [index("order_events_order_id_idx").on(table.orderId, table.id)]);

export const notificationOutbox = pgTable("notification_outbox", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => orderEvents.id, { onDelete: "restrict" }),
  channel: text("channel").notNull(),
  status: text("status").notNull().default("awaiting_provider"),
  attempts: integer("attempts").notNull().default(0),
  nextAttemptAt: timestamp("next_attempt_at"),
  deliveredAt: timestamp("delivered_at"),
  providerMessageId: text("provider_message_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [uniqueIndex("notification_outbox_event_channel_idx").on(table.eventId, table.channel)]);

export const storeSettings = pgTable("store_settings", {
  id: integer("id").primaryKey(),
  supportPhone: text("support_phone"),
  supportEmail: text("support_email"),
  serviceMessage: text("service_message"),
});
