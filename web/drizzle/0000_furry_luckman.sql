CREATE TABLE "battery_compatibility" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"vehicle_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"brand" text NOT NULL,
	"model" text NOT NULL,
	"category" text NOT NULL,
	"capacity_ah" integer,
	"warranty_months" integer,
	"mrp_paise" integer NOT NULL,
	"without_exchange_paise" integer NOT NULL,
	"with_exchange_paise" integer NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"brand" text NOT NULL,
	"model" text NOT NULL,
	"variant" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "battery_compatibility" ADD CONSTRAINT "battery_compatibility_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battery_compatibility" ADD CONSTRAINT "battery_compatibility_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "battery_vehicle_unique_idx" ON "battery_compatibility" USING btree ("product_id","vehicle_id");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicle_unique_idx" ON "vehicles" USING btree ("type","brand","model","variant");