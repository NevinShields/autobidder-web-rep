ALTER TABLE "directory_profiles"
  ADD COLUMN IF NOT EXISTS "landing_page_slug" text;

CREATE TABLE IF NOT EXISTS "landing_pages" (
  "id" serial PRIMARY KEY,
  "user_id" varchar NOT NULL REFERENCES "users"("id"),
  "slug" text NOT NULL UNIQUE,
  "status" varchar(10) NOT NULL DEFAULT 'draft',
  "published_at" timestamp,
  "business_name" text,
  "logo_url" text,
  "tagline" text,
  "cta_label" text NOT NULL DEFAULT 'Get Instant Quote',
  "trust_chips" jsonb,
  "services" jsonb,
  "primary_service_id" integer,
  "enable_multi_service" boolean NOT NULL DEFAULT false,
  "how_it_works" jsonb,
  "faqs" jsonb,
  "phone" text,
  "email" text,
  "service_area_text" text,
  "seo_title" text,
  "seo_description" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "landing_pages_user_id_unique" ON "landing_pages" ("user_id");

DO $$ BEGIN
  ALTER TABLE "landing_pages"
    ADD CONSTRAINT "landing_pages_status_check"
    CHECK ("status" IN ('draft','published'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "landing_page_events" (
  "id" serial PRIMARY KEY,
  "landing_page_id" integer NOT NULL REFERENCES "landing_pages"("id") ON DELETE CASCADE,
  "type" varchar(20) NOT NULL,
  "metadata" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE "landing_page_events"
    ADD CONSTRAINT "landing_page_events_type_check"
    CHECK ("type" IN ('view','lead_submit','callback_request'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
