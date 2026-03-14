ALTER TABLE "users" ADD COLUMN "share_slug" varchar;

CREATE UNIQUE INDEX "users_share_slug_unique" ON "users" USING btree ("share_slug");
