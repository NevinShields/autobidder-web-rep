CREATE TABLE IF NOT EXISTS "icon_groups" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL UNIQUE,
  "display_name" text NOT NULL,
  "description" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "display_order" integer NOT NULL DEFAULT 0,
  "created_by" varchar REFERENCES "users"("id"),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

ALTER TABLE "icons"
ADD COLUMN IF NOT EXISTS "group_id" integer REFERENCES "icon_groups"("id");
