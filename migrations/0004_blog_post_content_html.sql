CREATE TABLE "blog_layout_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"blog_type" text,
	"sections" jsonb NOT NULL,
	"preview_image_url" text,
	"is_active" boolean DEFAULT true,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"blog_type" text NOT NULL,
	"primary_service_id" integer,
	"target_city" text,
	"target_neighborhood" text,
	"goal" text,
	"work_order_id" integer,
	"lead_id" integer,
	"job_notes" text,
	"talking_points" jsonb,
	"tone_preference" text,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"meta_title" text,
	"meta_description" text,
	"excerpt" text,
	"content" jsonb NOT NULL,
	"content_html" text,
	"layout_template_id" integer,
	"seo_score" integer,
	"seo_checklist" jsonb,
	"featured_image_url" text,
	"category" text,
	"tags" jsonb,
	"status" text DEFAULT 'draft' NOT NULL,
	"scheduled_publish_at" timestamp,
	"published_at" timestamp,
	"duda_site_id" text,
	"duda_blog_post_id" text,
	"duda_status" text,
	"duda_last_sync_at" timestamp,
	"duda_live_url" text,
	"version" integer DEFAULT 1 NOT NULL,
	"parent_version_id" integer,
	"compliance_flags" jsonb,
	"word_count" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"blog_post_id" integer,
	"original_url" text NOT NULL,
	"processed_url" text,
	"thumbnail_url" text,
	"image_type" text NOT NULL,
	"alt_text" text,
	"caption" text,
	"exif_stripped" boolean DEFAULT false,
	"blur_applied" boolean DEFAULT false,
	"rights_confirmed" boolean DEFAULT false,
	"source_type" text,
	"source_id" integer,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_section_locks" (
	"id" serial PRIMARY KEY NOT NULL,
	"blog_post_id" integer NOT NULL,
	"section_id" text NOT NULL,
	"locked_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_primary_service_id_formulas_id_fk" FOREIGN KEY ("primary_service_id") REFERENCES "public"."formulas"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_layout_template_id_blog_layout_templates_id_fk" FOREIGN KEY ("layout_template_id") REFERENCES "public"."blog_layout_templates"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "blog_images" ADD CONSTRAINT "blog_images_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "blog_images" ADD CONSTRAINT "blog_images_blog_post_id_blog_posts_id_fk" FOREIGN KEY ("blog_post_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "blog_section_locks" ADD CONSTRAINT "blog_section_locks_blog_post_id_blog_posts_id_fk" FOREIGN KEY ("blog_post_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "blog_posts_user_idx" ON "blog_posts" ("user_id");
--> statement-breakpoint
CREATE INDEX "blog_posts_status_idx" ON "blog_posts" ("status");
--> statement-breakpoint
CREATE INDEX "blog_posts_duda_site_idx" ON "blog_posts" ("duda_site_id");
