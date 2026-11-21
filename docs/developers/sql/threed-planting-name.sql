-- Existing Plantings have a NULL name until one is saved.
BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE "public"."threed_plantings" ADD COLUMN "name" varchar(255);

COMMIT;
