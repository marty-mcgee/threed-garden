-- Learn Guide Category Assignments. Apply once to the reviewed target database.
-- Prerequisites: public.learn_guides and public.learn_categories.
-- Creates only the junction table and seeds no assignments.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL search_path = public;

CREATE TABLE "learn_guide_category_assignments" (
  "id" serial PRIMARY KEY NOT NULL,
  "guide_id" integer NOT NULL,
  "category_id" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE "learn_guide_category_assignments" ADD CONSTRAINT "learn_guide_category_assignments_guide_fk" FOREIGN KEY ("guide_id") REFERENCES "public"."learn_guides"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "learn_guide_category_assignments" ADD CONSTRAINT "learn_guide_category_assignments_category_fk" FOREIGN KEY ("category_id") REFERENCES "public"."learn_categories"("id") ON DELETE cascade ON UPDATE no action;
CREATE UNIQUE INDEX "learn_guide_category_assignments_guide_category_idx" ON "learn_guide_category_assignments" USING btree ("guide_id","category_id");
CREATE INDEX "learn_guide_category_assignments_category_idx" ON "learn_guide_category_assignments" USING btree ("category_id");

COMMIT;
-- Rollback before commit: roll back the transaction.
-- After commit: retain the additive table and any assignments.
