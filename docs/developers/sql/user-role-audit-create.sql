-- PROPOSAL: review and apply manually before using Users role Save.
-- Additive only. Does not modify accounts, assign roles or repair other schema drift.
-- Existing tables cause failure rather than being silently overwritten.
BEGIN;
SET LOCAL search_path = public;
CREATE TABLE "user_role_audit" (
  "id" serial PRIMARY KEY NOT NULL,
  "actor_user_id" text NOT NULL,
  "target_user_id" text NOT NULL,
  "previous_role" text,
  "new_role" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "user_role_audit_new_role" CHECK ("new_role" IN ('user', 'admin'))
);
CREATE INDEX "user_role_audit_target_idx" ON "user_role_audit" ("target_user_id", "created_at");
COMMIT;
-- Identity strings intentionally have no cascading foreign keys: preserve audit history.
-- Rollback: disable/revert the role-write feature and retain this table/history.
