ALTER TABLE blog_images
ADD COLUMN IF NOT EXISTS image_style text NOT NULL DEFAULT 'default';

