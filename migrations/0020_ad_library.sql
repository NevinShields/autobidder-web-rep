CREATE TABLE "ad_library_items" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "slug" text NOT NULL,
  "short_description" text,
  "full_description" text,
  "preview_image_url" text,
  "asset_file_url" text,
  "asset_file_name" text,
  "category" text,
  "style_tags" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "service_tags" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "tags" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "featured" boolean NOT NULL DEFAULT false,
  "active" boolean NOT NULL DEFAULT true,
  "downloadable" boolean NOT NULL DEFAULT false,
  "premium_only" boolean NOT NULL DEFAULT false,
  "customizable" boolean NOT NULL DEFAULT false,
  "sort_order" integer NOT NULL DEFAULT 0,
  "internal_notes" text,
  "created_by" varchar,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "ad_library_items_slug_unique" UNIQUE("slug")
);

CREATE TABLE "ad_branding_requests" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" varchar NOT NULL,
  "business_name" text,
  "logo_url" text,
  "phone_number" text,
  "email" text,
  "website" text,
  "brand_colors" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "notes" text,
  "status" text NOT NULL DEFAULT 'draft',
  "submitted_at" timestamp,
  "internal_notes" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "ad_branding_request_items" (
  "id" serial PRIMARY KEY NOT NULL,
  "request_id" integer NOT NULL,
  "ad_library_item_id" integer NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "ad_library_downloads" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" varchar NOT NULL,
  "ad_library_item_id" integer NOT NULL,
  "downloaded_at" timestamp NOT NULL DEFAULT now()
);

ALTER TABLE "ad_library_items"
ADD CONSTRAINT "ad_library_items_created_by_users_id_fk"
FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "ad_branding_requests"
ADD CONSTRAINT "ad_branding_requests_user_id_users_id_fk"
FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "ad_branding_request_items"
ADD CONSTRAINT "ad_branding_request_items_request_id_ad_branding_requests_id_fk"
FOREIGN KEY ("request_id") REFERENCES "public"."ad_branding_requests"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "ad_branding_request_items"
ADD CONSTRAINT "ad_branding_request_items_ad_library_item_id_ad_library_items_id_fk"
FOREIGN KEY ("ad_library_item_id") REFERENCES "public"."ad_library_items"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "ad_library_downloads"
ADD CONSTRAINT "ad_library_downloads_user_id_users_id_fk"
FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "ad_library_downloads"
ADD CONSTRAINT "ad_library_downloads_ad_library_item_id_ad_library_items_id_fk"
FOREIGN KEY ("ad_library_item_id") REFERENCES "public"."ad_library_items"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "ad_library_items_active_idx" ON "ad_library_items" USING btree ("active");
CREATE INDEX "ad_library_items_featured_idx" ON "ad_library_items" USING btree ("featured");
CREATE INDEX "ad_library_items_category_idx" ON "ad_library_items" USING btree ("category");
CREATE INDEX "ad_branding_requests_user_idx" ON "ad_branding_requests" USING btree ("user_id");
CREATE INDEX "ad_branding_requests_status_idx" ON "ad_branding_requests" USING btree ("status");
CREATE INDEX "ad_branding_request_items_request_idx" ON "ad_branding_request_items" USING btree ("request_id");
CREATE INDEX "ad_branding_request_items_item_idx" ON "ad_branding_request_items" USING btree ("ad_library_item_id");
CREATE INDEX "ad_library_downloads_user_idx" ON "ad_library_downloads" USING btree ("user_id");
CREATE INDEX "ad_library_downloads_item_idx" ON "ad_library_downloads" USING btree ("ad_library_item_id");
