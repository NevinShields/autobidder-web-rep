ALTER TABLE "business_settings" ADD COLUMN "estimate_page_settings" jsonb DEFAULT '{}'::jsonb NOT NULL;
--> statement-breakpoint
ALTER TABLE "estimates" ADD COLUMN "estimate_type" text DEFAULT 'confirmed' NOT NULL;
--> statement-breakpoint
ALTER TABLE "estimates" ADD COLUMN "custom_message" text;
--> statement-breakpoint
ALTER TABLE "estimates" ADD COLUMN "layout_id" text;
--> statement-breakpoint
ALTER TABLE "estimates" ADD COLUMN "theme" jsonb DEFAULT '{}'::jsonb;
--> statement-breakpoint
ALTER TABLE "estimates" ADD COLUMN "attachments" jsonb DEFAULT '[]'::jsonb;
--> statement-breakpoint
ALTER TABLE "estimates" ADD COLUMN "video_url" text;
--> statement-breakpoint
ALTER TABLE "estimates" ADD COLUMN "revision_reason" text;
--> statement-breakpoint
ALTER TABLE "estimates" ADD COLUMN "is_sent_locked" boolean DEFAULT false NOT NULL;
