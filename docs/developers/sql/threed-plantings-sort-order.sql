-- Existing and new Plantings start at Sort Order 0.
-- Equal ranks use Planting ID, then record ID, in ascending order.
BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE "public"."threed_plantings" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;

COMMIT;
