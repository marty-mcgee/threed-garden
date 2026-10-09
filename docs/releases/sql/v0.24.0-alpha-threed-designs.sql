-- SUPERSEDED independent-record candidate. Not required for Project Scene Design mode; historical review reference only. Never executed by this script.
BEGIN;
CREATE TABLE "threed_designs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"project_id" integer,
	"create_key" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"format_version" integer NOT NULL,
	"document" jsonb NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "threed_designs_revision_positive" CHECK ("threed_designs"."revision" > 0),
	CONSTRAINT "threed_designs_document_valid" CHECK (coalesce(jsonb_typeof("threed_designs"."document") = 'object' AND "threed_designs"."document"->>'format' = 'threed-home-design' AND "threed_designs"."document"->>'units' = 'metres' AND "threed_designs"."document"->'version' = to_jsonb("threed_designs"."format_version") AND "threed_designs"."format_version" = 5 AND "threed_designs"."document"->>'name' = "threed_designs"."name" AND length(trim("threed_designs"."name")) > 0, false))
);

--> statement-breakpoint
ALTER TABLE "threed_designs" ADD CONSTRAINT "threed_designs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "threed_designs" ADD CONSTRAINT "threed_designs_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_threed_designs_owner_create" ON "threed_designs" USING btree ("user_id","create_key");
--> statement-breakpoint
CREATE INDEX "idx_threed_designs_owner_project" ON "threed_designs" USING btree ("user_id","project_id");
COMMIT;
