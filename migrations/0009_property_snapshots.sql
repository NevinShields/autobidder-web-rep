CREATE TABLE IF NOT EXISTS "property_snapshots" (
  "id" serial PRIMARY KEY NOT NULL,
  "address_normalized" text NOT NULL,
  "address_input" text NOT NULL,
  "attributes_json" jsonb NOT NULL,
  "source" text NOT NULL DEFAULT 'attom',
  "retrieved_at" timestamp NOT NULL DEFAULT now(),
  "raw_payload_json" jsonb,
  "confidence_json" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "property_snapshots_address_idx" ON "property_snapshots" ("address_normalized");
