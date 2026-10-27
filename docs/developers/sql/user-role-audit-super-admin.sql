-- STAGE 1 PROPOSAL: audit compatibility only. Review before manual application.
-- Requires the already-created public.user_role_audit table.
-- Does NOT promote accounts, change defaults, or activate Super Admin permissions.
-- Keep 'user' valid for historical audit rows; new App roles will be admin/super_admin.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL search_path = public;

ALTER TABLE "user_role_audit"
  DROP CONSTRAINT "user_role_audit_new_role";
ALTER TABLE "user_role_audit"
  ADD CONSTRAINT "user_role_audit_new_role"
  CHECK ("new_role" IN ('user', 'admin', 'super_admin'));

COMMIT;
-- Both changes are atomic. Missing table/constraint or invalid rows fail the transaction.
-- Do not narrow this constraint after Super Admin audit entries exist.
