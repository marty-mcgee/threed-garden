-- v0.22.27: Simulation result history only. Generated offline from the Drizzle ORM schema by installed Drizzle Kit.
-- Apply to the intended Neon database before using result-backed Scene runs. Do not rerun v0.22.25 SQL.
BEGIN;

CREATE TABLE "threed_simulation_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"project_id" integer NOT NULL,
	"threed_id" integer NOT NULL,
	"simulation_id" integer,
	"scenario_id" integer,
	"run_id" uuid NOT NULL,
	"simulation_revision" integer NOT NULL,
	"status" varchar(16) DEFAULT 'running' NOT NULL,
	"snapshot" jsonb NOT NULL,
	"report" jsonb,
	"client_started_at" timestamp with time zone NOT NULL,
	"client_ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "threed_simulation_results_revision_positive" CHECK ("threed_simulation_results"."simulation_revision" > 0),
	CONSTRAINT "threed_simulation_results_status_valid" CHECK ("threed_simulation_results"."status" IN ('running', 'completed', 'failed', 'cancelled', 'timed-out')),
	CONSTRAINT "threed_simulation_results_snapshot_valid" CHECK (coalesce(jsonb_typeof("threed_simulation_results"."snapshot") = 'object' AND jsonb_typeof("threed_simulation_results"."snapshot"->'definition') = 'object' AND "threed_simulation_results"."snapshot"->'definition'->'version' = '1'::jsonb, false)),
	CONSTRAINT "threed_simulation_results_lifecycle_valid" CHECK (("threed_simulation_results"."status" = 'running' AND "threed_simulation_results"."report" IS NULL AND "threed_simulation_results"."client_ended_at" IS NULL) OR ("threed_simulation_results"."status" <> 'running' AND "threed_simulation_results"."report" IS NOT NULL AND "threed_simulation_results"."client_ended_at" IS NOT NULL AND "threed_simulation_results"."client_ended_at" >= "threed_simulation_results"."client_started_at" AND coalesce(jsonb_typeof("threed_simulation_results"."report") = 'object' AND "threed_simulation_results"."report"->'version' = '1'::jsonb AND "threed_simulation_results"."report"->>'source' = 'browser-scene' AND "threed_simulation_results"."report"->>'phase' = "threed_simulation_results"."status", false)))
);


ALTER TABLE "threed_simulation_results" ADD CONSTRAINT "threed_simulation_results_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "threed_simulation_results" ADD CONSTRAINT "threed_simulation_results_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "threed_simulation_results" ADD CONSTRAINT "threed_simulation_results_threed_id_threed_id_fk" FOREIGN KEY ("threed_id") REFERENCES "public"."threed"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "threed_simulation_results" ADD CONSTRAINT "threed_simulation_results_simulation_id_threed_simulations_id_fk" FOREIGN KEY ("simulation_id") REFERENCES "public"."threed_simulations"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "threed_simulation_results" ADD CONSTRAINT "threed_simulation_results_scenario_id_threed_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."threed_scenarios"("id") ON DELETE set null ON UPDATE no action;

CREATE UNIQUE INDEX "idx_threed_simulation_results_owner_run" ON "threed_simulation_results" USING btree ("user_id","run_id");

CREATE INDEX "idx_threed_simulation_results_owner_project_created" ON "threed_simulation_results" USING btree ("user_id","project_id","created_at");

CREATE INDEX "idx_threed_simulation_results_simulation_created" ON "threed_simulation_results" USING btree ("simulation_id","created_at");

CREATE INDEX "idx_threed_simulation_results_scenario" ON "threed_simulation_results" USING btree ("scenario_id");

COMMIT;
