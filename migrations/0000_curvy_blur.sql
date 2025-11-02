CREATE TABLE "availability_slots" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"date" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"is_booked" boolean DEFAULT false NOT NULL,
	"booked_by" integer,
	"title" text DEFAULT 'Available',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bid_email_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"template_type" text NOT NULL,
	"subject" text NOT NULL,
	"email_body" text NOT NULL,
	"from_name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bid_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_owner_id" text NOT NULL,
	"customer_name" text NOT NULL,
	"customer_email" text NOT NULL,
	"customer_phone" text,
	"address" text,
	"street_view_url" text,
	"auto_price" integer NOT NULL,
	"final_price" integer,
	"bid_status" text DEFAULT 'pending' NOT NULL,
	"customer_response_status" text DEFAULT 'awaiting',
	"customer_response_notes" text,
	"email_subject" text,
	"email_body" text,
	"pdf_text" text,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"magic_token" text,
	"token_expires_at" timestamp,
	"email_opened" boolean DEFAULT false NOT NULL,
	"lead_id" integer,
	"multi_service_lead_id" integer,
	"services" jsonb DEFAULT '[]'::jsonb,
	"applied_discounts" jsonb DEFAULT '[]'::jsonb,
	"selected_upsells" jsonb DEFAULT '[]'::jsonb,
	"bundle_discount" integer,
	"tax_amount" integer,
	"subtotal" integer,
	"customer_responded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bid_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"bid_request_id" integer NOT NULL,
	"response_type" text NOT NULL,
	"response_notes" text,
	"customer_email" text NOT NULL,
	"customer_name" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blocked_dates" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"business_name" text NOT NULL,
	"business_email" text,
	"business_phone" text,
	"business_address" text,
	"business_latitude" text,
	"business_longitude" text,
	"service_radius" integer DEFAULT 25,
	"enable_distance_pricing" boolean DEFAULT false NOT NULL,
	"distance_pricing_type" text DEFAULT 'dollar',
	"distance_pricing_rate" integer DEFAULT 0,
	"discounts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"allow_discount_stacking" boolean DEFAULT false NOT NULL,
	"guide_videos" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"styling" jsonb NOT NULL,
	"enable_lead_capture" boolean DEFAULT true NOT NULL,
	"enable_booking" boolean DEFAULT false NOT NULL,
	"max_days_out" integer DEFAULT 90,
	"enable_service_cart" boolean DEFAULT false NOT NULL,
	"enable_auto_expand_collapse" boolean DEFAULT true NOT NULL,
	"enable_route_optimization" boolean DEFAULT false NOT NULL,
	"route_optimization_threshold" integer DEFAULT 20,
	"stripe_config" jsonb,
	"configuration_title" text DEFAULT 'Service Configuration',
	"configuration_subtitle" text DEFAULT 'Please provide details for your selected services',
	"contact_title" text DEFAULT 'Contact Information',
	"contact_subtitle" text DEFAULT 'We need your contact details to send you the quote',
	"pricing_title" text DEFAULT 'Your Quote is Ready!',
	"pricing_subtitle" text DEFAULT 'Here''s your personalized pricing breakdown',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calculator_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"formula_id" integer NOT NULL,
	"session_id" text NOT NULL,
	"ip_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "calculator_sessions_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"type" varchar NOT NULL,
	"source" varchar DEFAULT 'internal' NOT NULL,
	"starts_at" timestamp NOT NULL,
	"ends_at" timestamp NOT NULL,
	"status" varchar DEFAULT 'confirmed' NOT NULL,
	"title" text,
	"description" text,
	"payload" jsonb,
	"is_editable" boolean DEFAULT true NOT NULL,
	"lead_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "call_availability_slots" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"is_booked" boolean DEFAULT false NOT NULL,
	"booked_by" integer,
	"max_bookings" integer DEFAULT 1 NOT NULL,
	"current_bookings" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "call_bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"company" text,
	"scheduled_date" text NOT NULL,
	"scheduled_time" text NOT NULL,
	"timezone" text DEFAULT 'America/New_York' NOT NULL,
	"notes" text,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"meeting_link" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_form_leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"custom_form_id" integer NOT NULL,
	"custom_form_slug" text NOT NULL,
	"custom_form_name" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"address" text,
	"address_latitude" text,
	"address_longitude" text,
	"distance_from_business" integer,
	"notes" text,
	"how_did_you_hear" text,
	"services" jsonb NOT NULL,
	"total_price" integer NOT NULL,
	"uploaded_images" jsonb DEFAULT '[]'::jsonb,
	"distance_info" jsonb,
	"applied_discounts" jsonb DEFAULT '[]'::jsonb,
	"selected_upsells" jsonb DEFAULT '[]'::jsonb,
	"tax_amount" integer DEFAULT 0,
	"subtotal" integer,
	"bundle_discount_amount" integer DEFAULT 0,
	"ip_address" text,
	"stage" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_forms" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" varchar NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"service_ids" jsonb NOT NULL,
	"inherits_design_from_primary" boolean DEFAULT true NOT NULL,
	"overrides" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_website_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"thumbnail_url" text,
	"preview_url" text,
	"template_id" text NOT NULL,
	"industry" text NOT NULL,
	"template_properties" json DEFAULT '{"type":"custom"}'::json,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "default_call_availability" (
	"id" serial PRIMARY KEY NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"duration" integer DEFAULT 30 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "design_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"styling" jsonb NOT NULL,
	"component_styles" jsonb NOT NULL,
	"custom_css" text,
	"device_view" text DEFAULT 'desktop',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dfy_service_purchases" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"service_id" integer NOT NULL,
	"stripe_payment_intent_id" text,
	"stripe_customer_id" text,
	"amount_paid" integer NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"service_status" text DEFAULT 'pending' NOT NULL,
	"purchase_notes" text,
	"delivery_notes" text,
	"completed_at" timestamp,
	"refunded_at" timestamp,
	"refund_amount" integer,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dfy_services" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"short_description" text,
	"price" integer NOT NULL,
	"stripe_price_id" text,
	"features" jsonb DEFAULT '[]'::jsonb,
	"category" text DEFAULT 'website' NOT NULL,
	"video_url" text,
	"thumbnail_url" text,
	"estimated_delivery" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"popular_service" boolean DEFAULT false NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "duda_template_metadata" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" text NOT NULL,
	"template_name" text NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"preview_url" text,
	"thumbnail_url" text,
	"desktop_thumbnail_url" text,
	"tablet_thumbnail_url" text,
	"mobile_thumbnail_url" text,
	"vertical" text,
	"template_type" text,
	"visibility" text,
	"can_build_from_url" boolean DEFAULT false,
	"has_store" boolean DEFAULT false,
	"has_blog" boolean DEFAULT false,
	"has_new_features" boolean DEFAULT false,
	"last_synced_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "duda_template_metadata_template_id_unique" UNIQUE("template_id")
);
--> statement-breakpoint
CREATE TABLE "duda_template_tag_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" text NOT NULL,
	"tag_id" integer NOT NULL,
	"assigned_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "duda_template_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#3B82F6',
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "duda_template_tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "email_send_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"email_type" text NOT NULL,
	"recipient_email" text NOT NULL,
	"subject" text NOT NULL,
	"status" text DEFAULT 'sent' NOT NULL,
	"provider" text,
	"error_message" text,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"business_email" text,
	"reply_to_email" text,
	"from_name" text,
	"email_signature" text,
	"notifications" jsonb DEFAULT '{"newLeads":true,"estimateRequests":true,"appointmentBookings":true,"systemUpdates":false,"weeklyReports":true}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"html_content" text NOT NULL,
	"text_content" text NOT NULL,
	"trigger_type" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "estimates" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer,
	"multi_service_lead_id" integer,
	"estimate_number" text NOT NULL,
	"customer_name" text NOT NULL,
	"customer_email" text NOT NULL,
	"customer_phone" text,
	"customer_address" text,
	"business_message" text,
	"services" jsonb NOT NULL,
	"subtotal" integer NOT NULL,
	"tax_amount" integer DEFAULT 0,
	"discount_amount" integer DEFAULT 0,
	"total_amount" integer NOT NULL,
	"valid_until" timestamp,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "estimates_estimate_number_unique" UNIQUE("estimate_number")
);
--> statement-breakpoint
CREATE TABLE "formula_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"bullet_points" jsonb,
	"variables" jsonb NOT NULL,
	"formula" text NOT NULL,
	"category" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"guide_video_url" text,
	"icon_url" text,
	"icon_id" integer,
	"enable_measure_map" boolean DEFAULT false NOT NULL,
	"measure_map_type" text DEFAULT 'area',
	"measure_map_unit" text DEFAULT 'sqft',
	"enable_photo_measurement" boolean DEFAULT false NOT NULL,
	"photo_measurement_setup" jsonb,
	"upsell_items" jsonb DEFAULT '[]'::jsonb,
	"enable_distance_pricing" boolean DEFAULT false NOT NULL,
	"distance_pricing_type" text DEFAULT 'dollar',
	"distance_pricing_rate" integer DEFAULT 0,
	"service_radius" integer DEFAULT 25,
	"min_price" integer,
	"max_price" integer,
	"template_styling" jsonb,
	"template_component_styles" jsonb,
	"created_by" varchar,
	"times_used" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "formulas" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"name" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"bullet_points" jsonb,
	"variables" jsonb NOT NULL,
	"formula" text NOT NULL,
	"styling" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_displayed" boolean DEFAULT true NOT NULL,
	"embed_id" text NOT NULL,
	"guide_video_url" text,
	"show_image" boolean DEFAULT false NOT NULL,
	"image_url" text,
	"icon_url" text,
	"icon_id" integer,
	"enable_measure_map" boolean DEFAULT false NOT NULL,
	"measure_map_type" text DEFAULT 'area',
	"measure_map_unit" text DEFAULT 'sqft',
	"enable_photo_measurement" boolean DEFAULT false NOT NULL,
	"photo_measurement_setup" jsonb,
	"upsell_items" jsonb DEFAULT '[]'::jsonb,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"enable_distance_pricing" boolean DEFAULT false NOT NULL,
	"distance_pricing_type" text DEFAULT 'dollar',
	"distance_pricing_rate" integer DEFAULT 0,
	"service_radius" integer DEFAULT 25,
	"min_price" integer,
	"max_price" integer,
	CONSTRAINT "formulas_embed_id_unique" UNIQUE("embed_id")
);
--> statement-breakpoint
CREATE TABLE "icon_tag_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"icon_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	"assigned_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "icon_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#3B82F6',
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "icon_tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "icons" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"filename" text NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "icons_filename_unique" UNIQUE("filename")
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"formula_id" integer NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"address" text,
	"address_latitude" text,
	"address_longitude" text,
	"distance_from_business" integer,
	"distance_fee" integer DEFAULT 0,
	"notes" text,
	"calculated_price" integer NOT NULL,
	"variables" jsonb NOT NULL,
	"uploaded_images" jsonb DEFAULT '[]'::jsonb,
	"distance_info" jsonb,
	"applied_discounts" jsonb DEFAULT '[]'::jsonb,
	"selected_upsells" jsonb DEFAULT '[]'::jsonb,
	"ip_address" text,
	"stage" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "measurement_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"photo_measurement_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"accuracy_rating" integer NOT NULL,
	"actual_value" integer,
	"actual_unit" text,
	"comments" text,
	"was_accurate" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "multi_service_leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_owner_id" text,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"address" text,
	"address_latitude" text,
	"address_longitude" text,
	"distance_from_business" integer,
	"total_distance_fee" integer DEFAULT 0,
	"notes" text,
	"how_did_you_hear" text,
	"services" jsonb NOT NULL,
	"total_price" integer NOT NULL,
	"booking_slot_id" integer,
	"uploaded_images" jsonb DEFAULT '[]'::jsonb,
	"distance_info" jsonb,
	"applied_discounts" jsonb DEFAULT '[]'::jsonb,
	"bundle_discount_amount" integer DEFAULT 0,
	"selected_upsells" jsonb DEFAULT '[]'::jsonb,
	"tax_amount" integer,
	"subtotal" integer,
	"ip_address" text,
	"stage" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"type" varchar NOT NULL,
	"title" varchar NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"data" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "onboarding_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"completed_steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"current_step" integer DEFAULT 1 NOT NULL,
	"business_setup_completed" boolean DEFAULT false NOT NULL,
	"first_calculator_created" boolean DEFAULT false NOT NULL,
	"design_customized" boolean DEFAULT false NOT NULL,
	"embed_code_generated" boolean DEFAULT false NOT NULL,
	"first_lead_received" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "password_reset_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"code_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"consumed_at" timestamp,
	"last_sent_at" timestamp DEFAULT now() NOT NULL,
	"request_ip" varchar(45)
);
--> statement-breakpoint
CREATE TABLE "photo_measurements" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer,
	"user_id" varchar NOT NULL,
	"formula_name" text,
	"setup_config" jsonb NOT NULL,
	"customer_image_urls" jsonb NOT NULL,
	"estimated_value" integer NOT NULL,
	"estimated_unit" text NOT NULL,
	"confidence" integer NOT NULL,
	"explanation" text NOT NULL,
	"warnings" jsonb DEFAULT '[]'::jsonb,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"title" text DEFAULT 'Service Proposal' NOT NULL,
	"subtitle" text,
	"header_text" text,
	"video_url" text,
	"custom_text" text,
	"terms_conditions_pdf_url" text,
	"insurance_pdf_url" text,
	"additional_documents" jsonb DEFAULT '[]'::jsonb,
	"show_company_logo" boolean DEFAULT true NOT NULL,
	"show_service_breakdown" boolean DEFAULT true NOT NULL,
	"show_discounts" boolean DEFAULT true NOT NULL,
	"show_upsells" boolean DEFAULT true NOT NULL,
	"show_total" boolean DEFAULT true NOT NULL,
	"enable_accept_reject" boolean DEFAULT true NOT NULL,
	"accept_button_text" text DEFAULT 'Accept Proposal',
	"reject_button_text" text DEFAULT 'Decline Proposal',
	"styling" jsonb DEFAULT '{"primaryColor":"#2563EB","backgroundColor":"#FFFFFF","textColor":"#1F2937","borderRadius":12,"fontFamily":"inter"}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recurring_availability" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"slot_duration" integer DEFAULT 60 NOT NULL,
	"title" text DEFAULT 'Available',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_content_ideas" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"keyword" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_cycles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"keywords" jsonb NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"completion_percentage" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"cycle_id" integer NOT NULL,
	"type" text NOT NULL,
	"title" text,
	"proof_link" text,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"subject" text NOT NULL,
	"description" text NOT NULL,
	"priority" varchar DEFAULT 'medium' NOT NULL,
	"status" varchar DEFAULT 'open' NOT NULL,
	"category" varchar DEFAULT 'general' NOT NULL,
	"assigned_to" varchar,
	"customer_email" text NOT NULL,
	"customer_name" text NOT NULL,
	"last_response_at" timestamp,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "template_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "ticket_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" integer NOT NULL,
	"sender_id" varchar,
	"sender_name" text NOT NULL,
	"sender_email" text NOT NULL,
	"message" text NOT NULL,
	"is_from_customer" boolean DEFAULT true NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"password_hash" varchar,
	"auth_provider" varchar DEFAULT 'email',
	"email_verified" boolean DEFAULT false,
	"email_verification_token" varchar,
	"password_reset_token" varchar,
	"password_reset_token_expires" timestamp,
	"user_type" varchar DEFAULT 'owner' NOT NULL,
	"owner_id" varchar,
	"organization_name" varchar,
	"is_active" boolean DEFAULT true NOT NULL,
	"plan" varchar DEFAULT 'trial',
	"stripe_customer_id" varchar,
	"stripe_subscription_id" varchar,
	"subscription_status" varchar DEFAULT 'trialing',
	"billing_period" varchar DEFAULT 'monthly',
	"trial_start_date" timestamp,
	"trial_end_date" timestamp,
	"trial_used" boolean DEFAULT false,
	"permissions" jsonb,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"onboarding_step" integer DEFAULT 1 NOT NULL,
	"business_info" jsonb,
	"is_beta_tester" boolean DEFAULT false NOT NULL,
	"google_calendar_connected" boolean DEFAULT false,
	"google_calendar_connection_id" text,
	"google_access_token" text,
	"google_refresh_token" text,
	"google_token_expiry" timestamp,
	"google_calendar_id" text DEFAULT 'primary',
	"selected_calendar_ids" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "websites" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"site_name" text NOT NULL,
	"account_name" text,
	"site_domain" text,
	"preview_url" text,
	"last_published" timestamp,
	"created_date" timestamp DEFAULT now() NOT NULL,
	"status" varchar DEFAULT 'draft' NOT NULL,
	"template_id" text,
	"duda_site_id" text,
	"duda_account_name" text,
	"duda_user_email" text,
	CONSTRAINT "websites_duda_site_id_unique" UNIQUE("duda_site_id")
);
--> statement-breakpoint
CREATE TABLE "zapier_api_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"name" text NOT NULL,
	"key_hash" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "zapier_api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "zapier_webhooks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"target_url" text NOT NULL,
	"event" text NOT NULL,
	"filters" text DEFAULT '{}',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bid_responses" ADD CONSTRAINT "bid_responses_bid_request_id_bid_requests_id_fk" FOREIGN KEY ("bid_request_id") REFERENCES "public"."bid_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocked_dates" ADD CONSTRAINT "blocked_dates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_settings" ADD CONSTRAINT "business_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calculator_sessions" ADD CONSTRAINT "calculator_sessions_formula_id_formulas_id_fk" FOREIGN KEY ("formula_id") REFERENCES "public"."formulas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_availability_slots" ADD CONSTRAINT "call_availability_slots_booked_by_call_bookings_id_fk" FOREIGN KEY ("booked_by") REFERENCES "public"."call_bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_form_leads" ADD CONSTRAINT "custom_form_leads_custom_form_id_custom_forms_id_fk" FOREIGN KEY ("custom_form_id") REFERENCES "public"."custom_forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_forms" ADD CONSTRAINT "custom_forms_account_id_users_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_website_templates" ADD CONSTRAINT "custom_website_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_settings" ADD CONSTRAINT "design_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dfy_service_purchases" ADD CONSTRAINT "dfy_service_purchases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dfy_service_purchases" ADD CONSTRAINT "dfy_service_purchases_service_id_dfy_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."dfy_services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dfy_services" ADD CONSTRAINT "dfy_services_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duda_template_tag_assignments" ADD CONSTRAINT "duda_template_tag_assignments_template_id_duda_template_metadata_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."duda_template_metadata"("template_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duda_template_tag_assignments" ADD CONSTRAINT "duda_template_tag_assignments_tag_id_duda_template_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."duda_template_tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duda_template_tag_assignments" ADD CONSTRAINT "duda_template_tag_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duda_template_tags" ADD CONSTRAINT "duda_template_tags_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formula_templates" ADD CONSTRAINT "formula_templates_icon_id_icons_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."icons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formula_templates" ADD CONSTRAINT "formula_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formulas" ADD CONSTRAINT "formulas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formulas" ADD CONSTRAINT "formulas_icon_id_icons_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."icons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "icon_tag_assignments" ADD CONSTRAINT "icon_tag_assignments_icon_id_icons_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."icons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "icon_tag_assignments" ADD CONSTRAINT "icon_tag_assignments_tag_id_icon_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."icon_tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "icon_tag_assignments" ADD CONSTRAINT "icon_tag_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "icon_tags" ADD CONSTRAINT "icon_tags_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measurement_feedback" ADD CONSTRAINT "measurement_feedback_photo_measurement_id_photo_measurements_id_fk" FOREIGN KEY ("photo_measurement_id") REFERENCES "public"."photo_measurements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measurement_feedback" ADD CONSTRAINT "measurement_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "multi_service_leads" ADD CONSTRAINT "multi_service_leads_business_owner_id_users_id_fk" FOREIGN KEY ("business_owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_progress" ADD CONSTRAINT "onboarding_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_codes" ADD CONSTRAINT "password_reset_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photo_measurements" ADD CONSTRAINT "photo_measurements_lead_id_multi_service_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."multi_service_leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photo_measurements" ADD CONSTRAINT "photo_measurements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_availability" ADD CONSTRAINT "recurring_availability_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_content_ideas" ADD CONSTRAINT "seo_content_ideas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_cycles" ADD CONSTRAINT "seo_cycles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_tasks" ADD CONSTRAINT "seo_tasks_cycle_id_seo_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."seo_cycles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zapier_api_keys" ADD CONSTRAINT "zapier_api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zapier_webhooks" ADD CONSTRAINT "zapier_webhooks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "calendar_events_user_starts_at_idx" ON "calendar_events" USING btree ("user_id","starts_at");--> statement-breakpoint
CREATE INDEX "calendar_events_user_type_idx" ON "calendar_events" USING btree ("user_id","type");--> statement-breakpoint
CREATE INDEX "custom_forms_account_slug_idx" ON "custom_forms" USING btree ("account_id","slug");--> statement-breakpoint
CREATE INDEX "password_reset_codes_user_expires_idx" ON "password_reset_codes" USING btree ("user_id","expires_at");--> statement-breakpoint
CREATE INDEX "password_reset_codes_active_unique_idx" ON "password_reset_codes" USING btree ("user_id") WHERE "password_reset_codes"."consumed_at" is null;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");