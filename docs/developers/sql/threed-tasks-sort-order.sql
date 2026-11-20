-- Existing and new Tasks start at Sort Order 0 unless an owner assigns a rank.
BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE "public"."threed_tasks" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;

COMMIT;
