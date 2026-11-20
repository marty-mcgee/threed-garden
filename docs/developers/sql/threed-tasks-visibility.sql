-- Preserve existing Task visibility and default new Tasks to private.
BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE "public"."threed_tasks" ADD COLUMN "is_public" boolean DEFAULT true NOT NULL;
ALTER TABLE "public"."threed_tasks" ALTER COLUMN "is_public" SET DEFAULT false;

COMMIT;
