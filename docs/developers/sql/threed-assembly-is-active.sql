-- Existing and new Assembly Groups default to Active.
BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE "public"."threed_assembly" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;

COMMIT;
