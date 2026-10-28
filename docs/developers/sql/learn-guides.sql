-- Learn-only prerequisite. Review and run manually before using persisted Learn guides.
-- Creates no guide records and changes no existing tables, accounts or Module assignments.
-- An existing learn_guides table causes failure: inspect it rather than replaying this script.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL search_path = public;
CREATE TABLE "learn_guides" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" varchar(255) NOT NULL,
  "slug" varchar(120) NOT NULL,
  "summary" varchar(500) DEFAULT '' NOT NULL,
  "content" text DEFAULT '' NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "is_published" boolean DEFAULT false NOT NULL,
  "revision" uuid NOT NULL,
  "created_by" text NOT NULL,
  "updated_by" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "learn_guides_slug_unique" UNIQUE ("slug"),
  CONSTRAINT "learn_guides_title_valid" CHECK (length(btrim("title")) BETWEEN 1 AND 255),
  CONSTRAINT "learn_guides_slug_valid" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT "learn_guides_content_length" CHECK (length("content") <= 100000),
  CONSTRAINT "learn_guides_sort_range" CHECK ("sort_order" BETWEEN -10000 AND 10000),
  CONSTRAINT "learn_guides_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action,
  CONSTRAINT "learn_guides_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action
);
CREATE INDEX "learn_guides_public_order_idx" ON "learn_guides" ("is_active", "is_published", "sort_order", "id");
COMMIT;
-- Attribution is retained when a User is soft-deleted; guides are shared App content.
-- Import Starter Guides is a separate, explicit Super Admin App action after this prerequisite.
-- Rollback: disable the Learn editorial/public database paths and retain this table and its data.
