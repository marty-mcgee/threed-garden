DROP INDEX "idx_project_assets_composite";--> statement-breakpoint
DROP INDEX "idx_project_assets_unique";--> statement-breakpoint
ALTER TABLE "project_assets" ADD COLUMN "module_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "project_assets" ADD COLUMN "module_type" text NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_project_assets_module_id" ON "project_assets" USING btree ("module_id");--> statement-breakpoint
CREATE INDEX "idx_project_assets_composite" ON "project_assets" USING btree ("project_id","module_type","asset_type","asset_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_project_assets_unique" ON "project_assets" USING btree ("project_id","module_id","asset_type","asset_id");