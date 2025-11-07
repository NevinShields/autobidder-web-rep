CREATE TABLE "crm_automation_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"automation_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"trigger_context" jsonb NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "crm_automation_step_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"automation_run_id" integer NOT NULL,
	"automation_step_id" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"error" text,
	"result" jsonb
);
--> statement-breakpoint
CREATE TABLE "crm_automation_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"automation_id" integer NOT NULL,
	"step_order" integer NOT NULL,
	"step_type" text NOT NULL,
	"step_config" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_automations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"trigger_type" text NOT NULL,
	"trigger_config" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_communications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"lead_id" integer,
	"multi_service_lead_id" integer,
	"work_order_id" integer,
	"automation_step_run_id" integer,
	"medium" text NOT NULL,
	"direction" text NOT NULL,
	"recipient_email" text,
	"recipient_phone" text,
	"subject" text,
	"body" text NOT NULL,
	"template_id" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"provider" text,
	"provider_message_id" text,
	"provider_status" text,
	"error_message" text,
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"opened_at" timestamp,
	"clicked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"twilio_account_sid" text,
	"twilio_auth_token" text,
	"twilio_phone_number" text,
	"twilio_enabled" boolean DEFAULT false NOT NULL,
	"invoice_webhook_url" text,
	"invoice_webhook_enabled" boolean DEFAULT false NOT NULL,
	"pipeline_stages" jsonb DEFAULT '[{"id":"new","name":"New Lead","color":"#3B82F6","order":1},{"id":"estimate_sent","name":"Estimate Sent","color":"#8B5CF6","order":2},{"id":"estimate_viewed","name":"Estimate Viewed","color":"#EC4899","order":3},{"id":"estimate_approved","name":"Estimate Approved","color":"#10B981","order":4},{"id":"booked","name":"Booked","color":"#F59E0B","order":5},{"id":"completed","name":"Completed","color":"#06B6D4","order":6},{"id":"paid","name":"Paid","color":"#22C55E","order":7},{"id":"lost","name":"Lost","color":"#EF4444","order":8}]'::jsonb,
	"notify_on_new_lead" boolean DEFAULT true NOT NULL,
	"notify_on_estimate_viewed" boolean DEFAULT true NOT NULL,
	"notify_on_booking" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "crm_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "seo_setup_checklist" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"website_id" integer,
	"category" text NOT NULL,
	"item_name" text NOT NULL,
	"description" text,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"notes" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"lead_id" integer,
	"multi_service_lead_id" integer,
	"estimate_id" integer,
	"work_order_number" text NOT NULL,
	"customer_name" text NOT NULL,
	"customer_email" text NOT NULL,
	"customer_phone" text,
	"customer_address" text,
	"scheduled_date" text,
	"scheduled_time" text,
	"assigned_to" varchar,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"instructions" text,
	"internal_notes" text,
	"total_amount" integer NOT NULL,
	"labor_cost" integer,
	"material_cost" integer,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "work_orders_work_order_number_unique" UNIQUE("work_order_number")
);
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "stage_history" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "last_stage_change" timestamp;--> statement-breakpoint
ALTER TABLE "multi_service_leads" ADD COLUMN "stage_history" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "multi_service_leads" ADD COLUMN "last_stage_change" timestamp;--> statement-breakpoint
ALTER TABLE "crm_automation_runs" ADD CONSTRAINT "crm_automation_runs_automation_id_crm_automations_id_fk" FOREIGN KEY ("automation_id") REFERENCES "public"."crm_automations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_automation_runs" ADD CONSTRAINT "crm_automation_runs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_automation_step_runs" ADD CONSTRAINT "crm_automation_step_runs_automation_run_id_crm_automation_runs_id_fk" FOREIGN KEY ("automation_run_id") REFERENCES "public"."crm_automation_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_automation_step_runs" ADD CONSTRAINT "crm_automation_step_runs_automation_step_id_crm_automation_steps_id_fk" FOREIGN KEY ("automation_step_id") REFERENCES "public"."crm_automation_steps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_automation_steps" ADD CONSTRAINT "crm_automation_steps_automation_id_crm_automations_id_fk" FOREIGN KEY ("automation_id") REFERENCES "public"."crm_automations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_automations" ADD CONSTRAINT "crm_automations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_communications" ADD CONSTRAINT "crm_communications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_communications" ADD CONSTRAINT "crm_communications_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_communications" ADD CONSTRAINT "crm_communications_multi_service_lead_id_multi_service_leads_id_fk" FOREIGN KEY ("multi_service_lead_id") REFERENCES "public"."multi_service_leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_communications" ADD CONSTRAINT "crm_communications_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_communications" ADD CONSTRAINT "crm_communications_automation_step_run_id_crm_automation_step_runs_id_fk" FOREIGN KEY ("automation_step_run_id") REFERENCES "public"."crm_automation_step_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_settings" ADD CONSTRAINT "crm_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_setup_checklist" ADD CONSTRAINT "seo_setup_checklist_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_setup_checklist" ADD CONSTRAINT "seo_setup_checklist_website_id_websites_id_fk" FOREIGN KEY ("website_id") REFERENCES "public"."websites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_multi_service_lead_id_multi_service_leads_id_fk" FOREIGN KEY ("multi_service_lead_id") REFERENCES "public"."multi_service_leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_estimate_id_estimates_id_fk" FOREIGN KEY ("estimate_id") REFERENCES "public"."estimates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;