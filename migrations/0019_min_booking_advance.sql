ALTER TABLE "business_settings"
ADD COLUMN "min_booking_advance_value" integer NOT NULL DEFAULT 0;

ALTER TABLE "business_settings"
ADD COLUMN "min_booking_advance_unit" text NOT NULL DEFAULT 'hours';
