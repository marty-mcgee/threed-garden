-- Existing and new Terrains default to Sort Order 0 and Active.
BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE "public"."threed_terrains"
  ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL,
  ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;

COMMIT;
