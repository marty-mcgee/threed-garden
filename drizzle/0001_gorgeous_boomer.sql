CREATE INDEX "idx_threed_tasks_user_id" ON "threed_tasks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_threed_tasks_priority" ON "threed_tasks" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_threed_tasks_plant" ON "threed_tasks" USING btree ("plant_id");--> statement-breakpoint
CREATE INDEX "idx_threed_tasks_bed" ON "threed_tasks" USING btree ("bed_id");