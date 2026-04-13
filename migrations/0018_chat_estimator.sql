ALTER TABLE "business_settings"
ADD COLUMN "chat_estimator_settings" jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE "chat_estimator_sessions" (
  "id" text PRIMARY KEY NOT NULL,
  "account_id" varchar NOT NULL,
  "calculator_id" integer NOT NULL,
  "selected_calculator_ids" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "current_calculator_index" integer NOT NULL DEFAULT 0,
  "visitor_id" text NOT NULL,
  "status" text NOT NULL DEFAULT 'active',
  "answers_json" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "contact_json" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "service_results_json" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "result_json" jsonb,
  "current_question_key" text,
  "lead_id" integer,
  "estimate_id" integer,
  "started_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  "completed_at" timestamp,
  "page_url" text,
  "referrer" text,
  "device_type" text
);

ALTER TABLE "chat_estimator_sessions"
ADD CONSTRAINT "chat_estimator_sessions_account_id_users_id_fk"
FOREIGN KEY ("account_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "chat_estimator_sessions"
ADD CONSTRAINT "chat_estimator_sessions_calculator_id_formulas_id_fk"
FOREIGN KEY ("calculator_id") REFERENCES "public"."formulas"("id") ON DELETE no action ON UPDATE no action;

CREATE TABLE "chat_estimator_events" (
  "id" serial PRIMARY KEY NOT NULL,
  "session_id" text NOT NULL,
  "account_id" varchar NOT NULL,
  "calculator_id" integer NOT NULL,
  "event_name" text NOT NULL,
  "question_key" text,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp NOT NULL DEFAULT now()
);

ALTER TABLE "chat_estimator_events"
ADD CONSTRAINT "chat_estimator_events_session_id_chat_estimator_sessions_id_fk"
FOREIGN KEY ("session_id") REFERENCES "public"."chat_estimator_sessions"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "chat_estimator_events"
ADD CONSTRAINT "chat_estimator_events_account_id_users_id_fk"
FOREIGN KEY ("account_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "chat_estimator_events"
ADD CONSTRAINT "chat_estimator_events_calculator_id_formulas_id_fk"
FOREIGN KEY ("calculator_id") REFERENCES "public"."formulas"("id") ON DELETE no action ON UPDATE no action;
