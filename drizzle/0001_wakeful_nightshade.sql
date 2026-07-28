DROP INDEX "idx_traffic_chp_center_region";--> statement-breakpoint
ALTER TABLE "traffic_chp_centers" ADD COLUMN "region" varchar(50);--> statement-breakpoint
CREATE INDEX "idx_traffic_chp_center_region" ON "traffic_chp_centers" USING btree ("region");