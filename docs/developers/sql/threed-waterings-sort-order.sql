-- Existing and new schedule and history records start at Sort Order 0.
BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE "public"."threed_watering_schedules" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;
ALTER TABLE "public"."threed_watering_history" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;

COMMIT;
