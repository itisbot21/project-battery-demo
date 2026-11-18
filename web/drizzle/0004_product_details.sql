
-- Project Battery: Product Details Upgrade
-- Additive migration - preserves existing data.

ALTER TABLE "products"
ADD COLUMN "description" text;

--> statement-breakpoint

ALTER TABLE "products"
ADD COLUMN "image_urls" jsonb
DEFAULT '[]'::jsonb NOT NULL;

--> statement-breakpoint

ALTER TABLE "products"
ADD COLUMN "features" jsonb
DEFAULT '[]'::jsonb NOT NULL;

--> statement-breakpoint

ALTER TABLE "products"
ADD COLUMN "specifications" jsonb
DEFAULT '{}'::jsonb NOT NULL;

--> statement-breakpoint

ALTER TABLE "products"
ADD COLUMN "warranty_free_months" integer;

--> statement-breakpoint

ALTER TABLE "products"
ADD COLUMN "warranty_pro_rata_months" integer;

--> statement-breakpoint

ALTER TABLE "products"
ADD COLUMN "seo_title" text;

--> statement-breakpoint

ALTER TABLE "products"
ADD COLUMN "seo_description" text;