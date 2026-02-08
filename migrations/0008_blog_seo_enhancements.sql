ALTER TABLE "blog_posts"
ADD COLUMN IF NOT EXISTS "internal_links" jsonb,
ADD COLUMN IF NOT EXISTS "video_url" text,
ADD COLUMN IF NOT EXISTS "facebook_post_url" text,
ADD COLUMN IF NOT EXISTS "gmb_post_url" text;
