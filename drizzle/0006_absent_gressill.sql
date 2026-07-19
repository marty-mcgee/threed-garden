CREATE TYPE "public"."asset_type" AS ENUM('music_album', 'music_track', 'music_media', 'music_link', 'music_playback_history', 'music_polling_log', 'threed_plant', 'threed_bed', 'threed_layer', 'threed_marker', 'threed_model', 'threed_character', 'threed_task', 'threed_harvest', 'threed_weather_log', 'threed_farmbot', 'threed_watering_schedule', 'traffic_chp_cad_incident', 'traffic_chp_case', 'traffic_caltrans_lane_closure', 'traffic_caltrans_cctv_camera', 'traffic_bay_area_511_event', 'traffic_calfire_incident');--> statement-breakpoint
CREATE TABLE "project_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"project_id" integer,
	"asset_type" "asset_type" NOT NULL,
	"asset_id" integer NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "project_assets" ADD CONSTRAINT "project_assets_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_assets" ADD CONSTRAINT "project_assets_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_project_assets_project_id" ON "project_assets" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_project_assets_asset_type" ON "project_assets" USING btree ("asset_type");--> statement-breakpoint
CREATE INDEX "idx_project_assets_composite" ON "project_assets" USING btree ("project_id","asset_type","asset_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_project_assets_unique" ON "project_assets" USING btree ("project_id","asset_type","asset_id");