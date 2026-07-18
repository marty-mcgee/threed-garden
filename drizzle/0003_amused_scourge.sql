/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'traffic_caltrans_lane_closures_snapshots'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "traffic_caltrans_lane_closures_snapshots" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "traffic_caltrans_lane_closures_snapshots" ALTER COLUMN "snapshot_id" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "traffic_caltrans_lane_closures_snapshots" ALTER COLUMN "snapshot_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "traffic_api_request_logs" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "traffic_bay_area_511_events" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "traffic_calfire_incidents" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "traffic_caltrans_cctv_cameras" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "traffic_caltrans_districts" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "traffic_caltrans_lane_closures" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "traffic_caltrans_lane_closures_snapshots" ADD COLUMN "id" serial PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "traffic_caltrans_lane_closures_snapshots" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "traffic_chp_cad_centers" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "traffic_chp_cad_incidents" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "traffic_chp_cases" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "traffic_api_request_logs" ADD CONSTRAINT "traffic_api_request_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traffic_bay_area_511_events" ADD CONSTRAINT "traffic_bay_area_511_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traffic_calfire_incidents" ADD CONSTRAINT "traffic_calfire_incidents_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traffic_caltrans_cctv_cameras" ADD CONSTRAINT "traffic_caltrans_cctv_cameras_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traffic_caltrans_districts" ADD CONSTRAINT "traffic_caltrans_districts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traffic_caltrans_lane_closures" ADD CONSTRAINT "traffic_caltrans_lane_closures_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traffic_caltrans_lane_closures_snapshots" ADD CONSTRAINT "traffic_caltrans_lane_closures_snapshots_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traffic_chp_cad_centers" ADD CONSTRAINT "traffic_chp_cad_centers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traffic_chp_cad_incidents" ADD CONSTRAINT "traffic_chp_cad_incidents_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traffic_chp_cases" ADD CONSTRAINT "traffic_chp_cases_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traffic_caltrans_lane_closures_snapshots" ADD CONSTRAINT "traffic_caltrans_lane_closures_snapshots_snapshot_id_unique" UNIQUE("snapshot_id");