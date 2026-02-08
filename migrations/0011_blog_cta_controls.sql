ALTER TABLE business_settings
ADD COLUMN IF NOT EXISTS blog_cta_enabled boolean NOT NULL DEFAULT true;

ALTER TABLE business_settings
ADD COLUMN IF NOT EXISTS blog_cta_url text;

ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS cta_button_enabled boolean;

ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS cta_button_url text;

