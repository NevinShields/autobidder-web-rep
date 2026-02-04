ALTER TABLE "estimates" ADD COLUMN "public_token" text;
ALTER TABLE "estimates" ADD COLUMN "public_token_expires_at" timestamp;
CREATE UNIQUE INDEX "estimates_public_token_unique" ON "estimates" ("public_token");
