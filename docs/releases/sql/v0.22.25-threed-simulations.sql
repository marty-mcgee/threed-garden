-- v0.22.25: ThreeD Simulations definition table only. Generated offline by installed Drizzle Kit.
-- Review against the intended database before execution. No runner or run/results tables.
BEGIN;

CREATE TABLE "threed_simulations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"project_id" integer NOT NULL,
	"threed_id" integer NOT NULL,
	"scenario_id" integer,
	"name" varchar(120) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"definition" jsonb DEFAULT '{"version":1,"steps":[],"observations":[]}'::jsonb NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "threed_simulations_name_valid" CHECK (length(trim("threed_simulations"."name")) > 0 AND "threed_simulations"."name" = trim("threed_simulations"."name")),
	CONSTRAINT "threed_simulations_slug_valid" CHECK ("threed_simulations"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "threed_simulations_revision_positive" CHECK ("threed_simulations"."revision" > 0),
	CONSTRAINT "threed_simulations_definition_valid" CHECK (coalesce(jsonb_typeof("threed_simulations"."definition") = 'object' AND "threed_simulations"."definition"->'version' = '1'::jsonb AND jsonb_typeof("threed_simulations"."definition"->'steps') = 'array' AND jsonb_typeof("threed_simulations"."definition"->'observations') = 'array', false))
);


ALTER TABLE "threed_simulations" ADD CONSTRAINT "threed_simulations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "threed_simulations" ADD CONSTRAINT "threed_simulations_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "threed_simulations" ADD CONSTRAINT "threed_simulations_threed_id_threed_id_fk" FOREIGN KEY ("threed_id") REFERENCES "public"."threed"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "threed_simulations" ADD CONSTRAINT "threed_simulations_scenario_id_threed_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."threed_scenarios"("id") ON DELETE set null ON UPDATE no action;

CREATE UNIQUE INDEX "idx_threed_simulations_project_threed_slug" ON "threed_simulations" USING btree ("project_id","threed_id","slug");

CREATE INDEX "idx_threed_simulations_owner_project" ON "threed_simulations" USING btree ("user_id","project_id");

CREATE INDEX "idx_threed_simulations_threed_id" ON "threed_simulations" USING btree ("threed_id");

CREATE INDEX "idx_threed_simulations_scenario_id" ON "threed_simulations" USING btree ("scenario_id");

COMMIT;
