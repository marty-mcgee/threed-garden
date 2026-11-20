-- Learn Categories schema. Apply once to the reviewed target database.
-- This transaction creates the shared taxonomy and seeds no categories.
-- If the table already exists, inspect its definition before proceeding.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL search_path = public;

CREATE TABLE "learn_categories" (
  "id" serial PRIMARY KEY NOT NULL,
  "parent_id" integer,
  "name" varchar(120) NOT NULL,
  "slug" varchar(120) NOT NULL,
  "description" text,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "revision" uuid NOT NULL,
  "created_by" text NOT NULL,
  "updated_by" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "learn_categories_slug_unique" UNIQUE("slug"),
  CONSTRAINT "learn_categories_name_valid" CHECK (length(btrim("learn_categories"."name")) BETWEEN 1 AND 120),
  CONSTRAINT "learn_categories_slug_valid" CHECK ("learn_categories"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT "learn_categories_sort_range" CHECK ("learn_categories"."sort_order" BETWEEN -10000 AND 10000),
  CONSTRAINT "learn_categories_parent_not_self" CHECK ("learn_categories"."parent_id" <> "learn_categories"."id")
);
ALTER TABLE "learn_categories" ADD CONSTRAINT "learn_categories_parent_id_learn_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."learn_categories"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "learn_categories" ADD CONSTRAINT "learn_categories_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "learn_categories" ADD CONSTRAINT "learn_categories_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;
CREATE INDEX "learn_categories_active_order_idx" ON "learn_categories" USING btree ("is_active","sort_order","id");
CREATE INDEX "learn_categories_parent_idx" ON "learn_categories" USING btree ("parent_id");

COMMIT;
-- Rollback before commit: roll back the transaction.
-- After commit: retain the additive table. Any removal requires separate review.
