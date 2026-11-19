CREATE TABLE "notification_outbox" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"channel" text NOT NULL,
	"status" text DEFAULT 'awaiting_provider' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp,
	"delivered_at" timestamp,
	"provider_message_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"actor_id" text,
	"kind" text NOT NULL,
	"details" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_settings" (
	"id" integer PRIMARY KEY NOT NULL,
	"support_phone" text,
	"support_email" text,
	"service_message" text
);
--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "advance_percentage" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "with_exchange_unit_price_paise" integer;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "final_line_total_paise" integer;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "approved_exchange_quantity" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "final_total_paise" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "tracking_token_hash" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "request_hash" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "stock_restored_at" timestamp;--> statement-breakpoint
ALTER TABLE "notification_outbox" ADD CONSTRAINT "notification_outbox_event_id_order_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."order_events"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "notification_outbox_event_channel_idx" ON "notification_outbox" USING btree ("event_id","channel");--> statement-breakpoint
CREATE INDEX "order_events_order_id_idx" ON "order_events" USING btree ("order_id","id");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_tracking_token_hash_unique" UNIQUE("tracking_token_hash");