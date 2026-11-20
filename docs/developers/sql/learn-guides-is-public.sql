-- Learn Guide visibility. Apply once to the reviewed target database.
-- Existing Guides keep the same public eligibility through Active and Published.
BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE "public"."learn_guides" ADD COLUMN "is_public" boolean DEFAULT true NOT NULL;

COMMIT;
-- Rollback before commit: roll back the transaction.
-- After commit: retain the column and its values.
