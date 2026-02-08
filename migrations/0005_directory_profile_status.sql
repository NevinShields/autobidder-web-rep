ALTER TABLE "directory_profiles"
  ADD COLUMN IF NOT EXISTS "status" varchar(10) NOT NULL DEFAULT 'approved';

DO $$ BEGIN
  ALTER TABLE "directory_profiles"
    ADD CONSTRAINT "directory_profiles_status_check"
    CHECK ("status" IN ('approved','pending','rejected'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
