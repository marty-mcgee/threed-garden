-- Rank the Assembly Groups list independently of composition revisions.
BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE "public"."threed_assembly" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;

COMMIT;
