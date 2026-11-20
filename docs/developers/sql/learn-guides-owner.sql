-- Learn Guide ownership. Apply once to the reviewed target database.
-- Existing Guides use their recorded creators as owners.
BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE "public"."learn_guides" ADD COLUMN "user_id" text;
UPDATE "public"."learn_guides" SET "user_id" = "created_by" WHERE "user_id" IS NULL;
ALTER TABLE "public"."learn_guides" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "public"."learn_guides" ADD CONSTRAINT "learn_guides_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;
CREATE INDEX "learn_guides_user_id_idx" ON "public"."learn_guides" ("user_id");

COMMIT;
-- Rollback before commit: roll back the transaction.
-- After commit: retain the column and values. Writers must supply the owner ID.
