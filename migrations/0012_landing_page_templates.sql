ALTER TABLE "landing_pages"
  ADD COLUMN IF NOT EXISTS "template_key" text NOT NULL DEFAULT 'classic';

ALTER TABLE "landing_pages"
  ADD COLUMN IF NOT EXISTS "theme" jsonb;
