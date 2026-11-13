CREATE TABLE "delivery_pincodes" (
	"pin_code" text PRIMARY KEY NOT NULL,
	"city" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
