BEGIN;

CREATE UNIQUE INDEX "idx_project_threed_markers_typed_runtime" ON "project_threed_markers" USING btree ("project_id","marker_id","marker_type");

CREATE TABLE "threed_group_design_members" (
	"project_id" integer NOT NULL,
	"group_id" uuid NOT NULL,
	"entity_id" text NOT NULL,
	CONSTRAINT "threed_group_design_members_project_id_group_id_entity_id_pk" PRIMARY KEY("project_id","group_id","entity_id"),
	CONSTRAINT "threed_group_design_members_entity_nonempty" CHECK (length(trim("threed_group_design_members"."entity_id")) > 0)
);

CREATE TABLE "threed_group_model_members" (
	"project_id" integer NOT NULL,
	"group_id" uuid NOT NULL,
	"marker_id" text NOT NULL,
	"marker_type" "project_threed_marker_type" DEFAULT 'models' NOT NULL,
	CONSTRAINT "threed_group_model_members_project_id_group_id_marker_id_pk" PRIMARY KEY("project_id","group_id","marker_id"),
	CONSTRAINT "threed_group_model_members_model_only" CHECK ("threed_group_model_members"."marker_type" = 'models')
);

CREATE TABLE "threed_groups" (
	"project_id" integer NOT NULL,
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "threed_groups_project_id_id_pk" PRIMARY KEY("project_id","id"),
	CONSTRAINT "threed_groups_name_nonempty" CHECK (length(trim("threed_groups"."name")) > 0)
);

ALTER TABLE "threed_group_design_members" ADD CONSTRAINT "threed_group_design_members_group_fk" FOREIGN KEY ("project_id","group_id") REFERENCES "public"."threed_groups"("project_id","id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "threed_group_model_members" ADD CONSTRAINT "threed_group_model_members_group_fk" FOREIGN KEY ("project_id","group_id") REFERENCES "public"."threed_groups"("project_id","id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "threed_group_model_members" ADD CONSTRAINT "threed_group_model_members_placement_fk" FOREIGN KEY ("project_id","marker_id","marker_type") REFERENCES "public"."project_threed_markers"("project_id","marker_id","marker_type") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "threed_groups" ADD CONSTRAINT "threed_groups_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;

COMMIT;
