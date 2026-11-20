-- Existing and new Harvests start at Sort Order 0.
BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE "public"."threed_harvests" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;

COMMIT;
