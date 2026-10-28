-- Required before deploying the Users CRUD / soft-delete code.
-- Run manually as one transaction. No roles or account activity are changed.
-- Existing accounts are backfilled as not deleted. New-account defaults belong
-- to ThreeD App: there is intentionally NO SQL column default.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL search_path = public;
ALTER TABLE "user" ADD COLUMN "is_deleted" boolean;
UPDATE "user" SET "is_deleted" = false;
ALTER TABLE "user" ALTER COLUMN "is_deleted" SET NOT NULL;
COMMIT;
-- If the column already exists, this fails rather than overwriting deletion flags.
-- Rollback: retain this column and its flags; do not revert to code that ignores
-- is_deleted while deleted accounts exist. Never physically delete User rows.
