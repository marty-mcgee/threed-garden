CREATE TYPE "public"."threed_bed_shape" AS ENUM('rectangle', 'square', 'circle', 'raised', 'container', 'custom');--> statement-breakpoint
CREATE TYPE "public"."threed_character_animation" AS ENUM('idle', 'walk', 'run', 'fly', 'dance', 'sway', 'float', 'spin', 'bounce');--> statement-breakpoint
CREATE TYPE "public"."threed_character_emote" AS ENUM('none', 'happy', 'sad', 'surprised', 'angry', 'wave', 'dance', 'sleep');--> statement-breakpoint
CREATE TYPE "public"."threed_character_movement_type" AS ENUM('stationary', 'wander', 'patrol', 'circle', 'follow', 'teleport');--> statement-breakpoint
CREATE TYPE "public"."threed_character_status" AS ENUM('active', 'idle', 'sleeping', 'moving', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."threed_character_type" AS ENUM('animal', 'bird', 'insect', 'mythical', 'human', 'robot', 'decoration');--> statement-breakpoint
CREATE TYPE "public"."threed_character_weather_sensitivity" AS ENUM('all', 'sunny_only', 'rainy_only', 'no_rain', 'no_snow');--> statement-breakpoint
CREATE TYPE "public"."threed_farmbot_status" AS ENUM('online', 'offline', 'maintenance', 'error');--> statement-breakpoint
CREATE TYPE "public"."threed_growth_stage" AS ENUM('seed', 'seedling', 'vegetative', 'flowering', 'fruiting', 'mature', 'dormant');--> statement-breakpoint
CREATE TYPE "public"."threed_model_type" AS ENUM('procedural', 'gltf', 'glb', 'fbx', 'usdz', 'obj', 'herb-generic', 'vegetable-generic', 'flower-generic', 'fruit-generic', 'tree-generic', 'custom');--> statement-breakpoint
CREATE TYPE "public"."threed_plant_status" AS ENUM('active', 'inactive', 'archived');--> statement-breakpoint
CREATE TYPE "public"."threed_plant_type" AS ENUM('Vegetable', 'Fruit', 'Herb', 'Flower', 'Tree', 'Shrub', 'CoverCrop');--> statement-breakpoint
CREATE TYPE "public"."threed_planting_status" AS ENUM('planned', 'planted', 'growing', 'harvesting', 'harvested', 'failed');--> statement-breakpoint
CREATE TYPE "public"."threed_task_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."threed_task_status" AS ENUM('pending', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."threed_watering_frequency" AS ENUM('daily', 'weekly', 'custom', 'moisture-based', 'hourly', 'bi-daily');--> statement-breakpoint
CREATE TABLE "api_request_logs" (
	"log_id" serial PRIMARY KEY NOT NULL,
	"endpoint" text,
	"district" integer,
	"response_time_ms" integer,
	"status_code" integer,
	"success" boolean,
	"records_fetched" integer DEFAULT 0,
	"error_message" text,
	"response_size_bytes" integer,
	"request_timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bay_area_traffic_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_id" varchar(100),
	"event_type" varchar(100),
	"event_sub_type" varchar(100),
	"severity" varchar(50),
	"status" varchar(20) DEFAULT 'active',
	"title" text,
	"description" text,
	"roadway_name" varchar(100),
	"direction_of_travel" varchar(50),
	"lanes_affected" text,
	"is_full_closure" boolean DEFAULT false,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"start_time" timestamp,
	"end_time" timestamp,
	"last_updated" timestamp,
	"raw_data" jsonb,
	"fetched_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "bay_area_traffic_events_source_id_unique" UNIQUE("source_id")
);
--> statement-breakpoint
CREATE TABLE "calfire_incidents" (
	"id" serial PRIMARY KEY NOT NULL,
	"unique_id" varchar(100) NOT NULL,
	"name" varchar(200) NOT NULL,
	"type" varchar(50) DEFAULT 'Wildfire',
	"status" varchar(20) DEFAULT 'active',
	"county" varchar(100),
	"location" text,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"acres_burned" numeric(12, 1),
	"percent_contained" numeric(5, 1),
	"started_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	"extinguished_at" timestamp with time zone,
	"admin_unit" varchar(200),
	"url" text,
	"is_active" boolean DEFAULT true,
	"is_calfire_incident" boolean DEFAULT false,
	"raw_data" jsonb,
	"fetched_at" timestamp with time zone DEFAULT now(),
	"last_seen" timestamp with time zone DEFAULT now(),
	CONSTRAINT "calfire_incidents_unique_id_unique" UNIQUE("unique_id")
);
--> statement-breakpoint
CREATE TABLE "caltrans_districts" (
	"district_id" integer PRIMARY KEY NOT NULL,
	"district_name" varchar(100),
	"region" varchar(50),
	"counties" text[],
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cctv_cameras" (
	"camera_id" serial PRIMARY KEY NOT NULL,
	"index" varchar(10),
	"district" integer,
	"location_name" varchar(100),
	"nearby_place" varchar(100),
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"direction" varchar(10),
	"county" varchar(50),
	"route" varchar(20),
	"in_service" boolean,
	"current_image_url" text,
	"last_updated" timestamp,
	"raw_data" jsonb,
	"fetched_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chp_cad_centers" (
	"id" serial PRIMARY KEY NOT NULL,
	"center_code" varchar(10) NOT NULL,
	"center_name" varchar(100) NOT NULL,
	"county" varchar(100),
	"region" varchar(50),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "chp_cad_centers_center_code_unique" UNIQUE("center_code")
);
--> statement-breakpoint
CREATE TABLE "chp_cad_incidents" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_id" varchar(100),
	"center_id" integer,
	"incident_type" varchar(100),
	"location" text,
	"city" varchar(100),
	"county" varchar(100),
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"log_time" timestamp,
	"details" text,
	"status" varchar(20) DEFAULT 'active',
	"fetched_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "chp_cad_incidents_source_id_unique" UNIQUE("source_id")
);
--> statement-breakpoint
CREATE TABLE "chp_collisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" varchar(50),
	"collision_date" timestamp,
	"collision_year" integer,
	"severity" varchar(50),
	"county" varchar(100),
	"city" varchar(100),
	"location" text,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"primary_factor" text,
	"weather" varchar(50),
	"lighting" varchar(50),
	"injuries" integer DEFAULT 0,
	"fatalities" integer DEFAULT 0,
	"raw_data" jsonb,
	"fetched_at" timestamp DEFAULT now(),
	"last_seen" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "chp_collisions_case_id_unique" UNIQUE("case_id")
);
--> statement-breakpoint
CREATE TABLE "lane_closures" (
	"closure_id" serial PRIMARY KEY NOT NULL,
	"source_id" varchar(100),
	"district" integer,
	"route" varchar(20),
	"direction" varchar(10),
	"closure_type" varchar(50),
	"closure_subtype" varchar(50),
	"lanes_affected" text,
	"lanes_closed" text,
	"lane_configuration" text,
	"start_date" timestamp,
	"end_date" timestamp,
	"start_time" varchar(8),
	"end_time" varchar(8),
	"start_timestamp" timestamp,
	"end_timestamp" timestamp,
	"description" text,
	"location_description" text,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"county" varchar(100),
	"city" varchar(100),
	"status" varchar(20) DEFAULT 'active',
	"first_seen" timestamp DEFAULT now(),
	"last_seen" timestamp DEFAULT now(),
	"last_modified" timestamp DEFAULT now(),
	"times_seen" integer DEFAULT 1,
	"raw_data" jsonb,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "lane_closures_source_id_unique" UNIQUE("source_id")
);
--> statement-breakpoint
CREATE TABLE "lane_closures_snapshots" (
	"snapshot_id" serial PRIMARY KEY NOT NULL,
	"snapshot_timestamp" timestamp DEFAULT now(),
	"district" integer,
	"total_closures" integer,
	"closures_by_type" jsonb,
	"closures_by_route" jsonb,
	"raw_summary" jsonb
);
--> statement-breakpoint
CREATE TABLE "threed_beds" (
	"id" serial PRIMARY KEY NOT NULL,
	"bed_id" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"shape" "threed_bed_shape" DEFAULT 'rectangle',
	"width_feet" numeric(5, 2),
	"length_feet" numeric(5, 2),
	"square_feet" numeric(8, 2),
	"height_feet" numeric(5, 2) DEFAULT '1',
	"soil_type" varchar(50),
	"sun_exposure" varchar(50),
	"position_x" numeric(8, 2) DEFAULT '0',
	"position_y" numeric(8, 2) DEFAULT '0',
	"position_z" numeric(8, 2) DEFAULT '0',
	"rotation" numeric(8, 2) DEFAULT '0',
	"scale" numeric(5, 2) DEFAULT '1',
	"is_active" boolean DEFAULT true,
	"color" varchar(20) DEFAULT '#8B5E3C',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "threed_beds_bed_id_unique" UNIQUE("bed_id")
);
--> statement-breakpoint
CREATE TABLE "threed_characters" (
	"id" serial PRIMARY KEY NOT NULL,
	"character_id" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" "threed_character_type" DEFAULT 'animal',
	"status" "threed_character_status" DEFAULT 'active',
	"model_id" integer,
	"animations" "threed_character_animation"[] DEFAULT '{}',
	"default_animation" "threed_character_animation",
	"animation_speed" numeric(4, 2) DEFAULT '1.0',
	"is_movable" boolean DEFAULT false,
	"movement_type" "threed_character_movement_type" DEFAULT 'stationary',
	"movement_pattern" varchar(50),
	"movement_radius" numeric(5, 2),
	"movement_speed" numeric(4, 2) DEFAULT '0.5',
	"patrol_waypoints" jsonb DEFAULT '[]'::jsonb,
	"follow_target" varchar(50),
	"follow_distance" numeric(4, 2) DEFAULT '2.0',
	"teleport_positions" jsonb DEFAULT '[]'::jsonb,
	"teleport_interval" integer,
	"interactable" boolean DEFAULT true,
	"interaction_message" text,
	"sound_effect" varchar(255),
	"default_emote" "threed_character_emote" DEFAULT 'none',
	"emote_on_interact" "threed_character_emote" DEFAULT 'happy',
	"active_start_hour" integer,
	"active_end_hour" integer,
	"weather_sensitivity" "threed_character_weather_sensitivity" DEFAULT 'all',
	"bed_id" integer,
	"position_x" numeric(8, 2) DEFAULT '0',
	"position_y" numeric(8, 2) DEFAULT '0',
	"position_z" numeric(8, 2) DEFAULT '0',
	"rotation" numeric(8, 2) DEFAULT '0',
	"scale" numeric(5, 2) DEFAULT '1',
	"scale_multiplier" numeric(5, 2) DEFAULT '1',
	"color_tint" varchar(20),
	"visible" boolean DEFAULT true,
	"visible_distance" numeric(5, 2) DEFAULT '30.0',
	"is_active" boolean DEFAULT true,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "threed_characters_character_id_unique" UNIQUE("character_id")
);
--> statement-breakpoint
CREATE TABLE "threed_farmbot_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"farmbot_id" integer,
	"event_type" varchar(50),
	"status" varchar(20),
	"message" text,
	"sensor_data" jsonb,
	"raw_data" jsonb,
	"logged_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "threed_farmbots" (
	"id" serial PRIMARY KEY NOT NULL,
	"device_id" varchar(100) NOT NULL,
	"name" varchar(100) NOT NULL,
	"status" "threed_farmbot_status" DEFAULT 'offline',
	"bed_id" integer,
	"position_x" numeric(8, 2),
	"position_y" numeric(8, 2),
	"position_z" numeric(8, 2),
	"api_token" varchar(255),
	"api_url" varchar(255),
	"last_seen" timestamp,
	"battery_level" integer,
	"firmware_version" varchar(50),
	"is_active" boolean DEFAULT true,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "threed_farmbots_device_id_unique" UNIQUE("device_id")
);
--> statement-breakpoint
CREATE TABLE "threed_harvests" (
	"id" serial PRIMARY KEY NOT NULL,
	"harvest_id" varchar(50) NOT NULL,
	"planting_id" integer,
	"plant_id" integer,
	"quantity" numeric(8, 2),
	"unit" varchar(20) DEFAULT 'lbs',
	"weight_lbs" numeric(8, 2),
	"harvest_date" timestamp DEFAULT now(),
	"notes" text,
	"image_url" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "threed_harvests_harvest_id_unique" UNIQUE("harvest_id")
);
--> statement-breakpoint
CREATE TABLE "threed_model_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"model_id" integer,
	"file_name" varchar(255) NOT NULL,
	"file_type" varchar(50) NOT NULL,
	"texture_type" varchar(50),
	"file_path" varchar(500) NOT NULL,
	"file_size" integer,
	"is_binary_buffer" boolean DEFAULT false,
	"load_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "threed_models" (
	"id" serial PRIMARY KEY NOT NULL,
	"used_by_plants" boolean DEFAULT false,
	"used_by_characters" boolean DEFAULT false,
	"model_name" varchar(255) NOT NULL,
	"model_type" "threed_model_type" NOT NULL,
	"file_path" varchar(500) NOT NULL,
	"file_size" integer,
	"thumbnail_url" text,
	"scale" numeric(5, 2) DEFAULT '1.0',
	"rotation_y" numeric(5, 2) DEFAULT '0.0',
	"offset_x" numeric(5, 2) DEFAULT '0.0',
	"offset_y" numeric(5, 2) DEFAULT '0.0',
	"offset_z" numeric(5, 2) DEFAULT '0.0',
	"has_lod" boolean DEFAULT false,
	"lod_levels" jsonb DEFAULT '{}'::jsonb,
	"animations" jsonb DEFAULT '[]'::jsonb,
	"default_animation" varchar(50),
	"has_external_files" boolean DEFAULT false,
	"texture_count" integer DEFAULT 0,
	"main_model_file_id" integer,
	"is_active" boolean DEFAULT true,
	"is_default" boolean DEFAULT false,
	"uploaded_by" varchar(255),
	"uploaded_at" timestamp DEFAULT now(),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "threed_plantings" (
	"id" serial PRIMARY KEY NOT NULL,
	"planting_id" varchar(50) NOT NULL,
	"plant_id" integer,
	"bed_id" integer,
	"custom_model_id" integer,
	"model_scale" numeric(5, 2) DEFAULT '1.0',
	"model_offset" jsonb DEFAULT '{"x":0,"y":0,"z":0}'::jsonb,
	"quantity" integer DEFAULT 1,
	"spacing_inches" integer,
	"position_x" numeric(8, 2),
	"position_y" numeric(8, 2),
	"position_z" numeric(8, 2),
	"planted_date" timestamp,
	"expected_germination_date" timestamp,
	"expected_harvest_date" timestamp,
	"actual_harvest_date" timestamp,
	"status" "threed_planting_status" DEFAULT 'planted',
	"growth_stage" "threed_growth_stage" DEFAULT 'seed',
	"health" varchar(20) DEFAULT 'good',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "threed_plantings_planting_id_unique" UNIQUE("planting_id")
);
--> statement-breakpoint
CREATE TABLE "threed_plants" (
	"id" serial PRIMARY KEY NOT NULL,
	"plant_id" varchar(50) NOT NULL,
	"common_name" varchar(255) NOT NULL,
	"scientific_name" varchar(255),
	"variety" varchar(100),
	"family" varchar(100),
	"type" "threed_plant_type" DEFAULT 'Vegetable',
	"status" "threed_plant_status" DEFAULT 'active',
	"model_id" integer,
	"growth_habit" varchar(50),
	"days_to_maturity" integer,
	"days_to_germination" integer,
	"days_to_harvest" integer,
	"spacing_inches" integer,
	"row_spacing_inches" integer,
	"planting_depth_inches" numeric(3, 1),
	"sunlight" varchar(50) DEFAULT 'Full Sun',
	"water_needs" varchar(20) DEFAULT 'Medium',
	"soil_type" text,
	"soil_ph" numeric(3, 1),
	"hardiness_zone" varchar(10),
	"frost_tolerant" boolean DEFAULT false,
	"perennial" boolean DEFAULT false,
	"image_url" text,
	"thumbnail_url" text,
	"description" text,
	"care_instructions" text,
	"harvest_instructions" text,
	"companion_plants" text,
	"avoid_plants" text,
	"source" varchar(100),
	"raw_data" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "threed_plants_plant_id_unique" UNIQUE("plant_id")
);
--> statement-breakpoint
CREATE TABLE "threed_system_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"level" varchar(20),
	"source" varchar(100),
	"message" text,
	"details" jsonb,
	"logged_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "threed_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" varchar(50) NOT NULL,
	"planting_id" integer,
	"plant_id" integer,
	"bed_id" integer,
	"watering_schedule_id" integer,
	"title" varchar(200) NOT NULL,
	"description" text,
	"type" varchar(50),
	"priority" "threed_task_priority" DEFAULT 'medium',
	"status" "threed_task_status" DEFAULT 'pending',
	"due_date" timestamp,
	"completed_at" timestamp,
	"assigned_to" varchar(100),
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "threed_tasks_task_id_unique" UNIQUE("task_id")
);
--> statement-breakpoint
CREATE TABLE "threed_watering_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"history_id" varchar(50) NOT NULL,
	"schedule_id" integer,
	"plant_id" integer,
	"farmbot_id" integer,
	"planting_id" integer,
	"status" varchar(20) NOT NULL,
	"duration_ms" integer,
	"volume_ml" integer,
	"skip_reason" text,
	"error_message" text,
	"soil_moisture_before" integer,
	"soil_moisture_after" integer,
	"temperature_at_time" numeric(5, 1),
	"weather_at_time" jsonb,
	"executed_at" timestamp DEFAULT now(),
	"executed_by" varchar(50) DEFAULT 'automated',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "threed_watering_history_history_id_unique" UNIQUE("history_id")
);
--> statement-breakpoint
CREATE TABLE "threed_watering_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"schedule_id" varchar(50) NOT NULL,
	"plant_id" integer,
	"farmbot_id" integer,
	"bed_id" integer,
	"planting_id" integer,
	"frequency" "threed_watering_frequency" NOT NULL,
	"interval_days" integer,
	"days_of_week" integer[],
	"time_of_day" time,
	"duration_ms" integer NOT NULL,
	"volume_ml" integer,
	"moisture_threshold" integer,
	"next_watering" timestamp NOT NULL,
	"last_watering" timestamp,
	"is_active" boolean DEFAULT true,
	"skip_if_rain" boolean DEFAULT true,
	"max_temperature" integer,
	"min_temperature" integer,
	"max_wind_speed" integer,
	"repeat_count" integer,
	"times_executed" integer DEFAULT 0,
	"notes" text,
	"created_by" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "threed_watering_schedules_schedule_id_unique" UNIQUE("schedule_id")
);
--> statement-breakpoint
CREATE TABLE "threed_weather_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"recorded_at" timestamp DEFAULT now(),
	"temperature" numeric(5, 1),
	"humidity" numeric(5, 1),
	"rainfall_inches" numeric(5, 2),
	"soil_moisture" numeric(5, 1),
	"sunlight_hours" numeric(4, 1),
	"wind_speed" numeric(5, 1),
	"frost_warning" boolean DEFAULT false,
	"heat_warning" boolean DEFAULT false,
	"drought_warning" boolean DEFAULT false,
	"source" varchar(50) DEFAULT 'api',
	"raw_data" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "chp_cad_incidents" ADD CONSTRAINT "chp_cad_incidents_center_id_chp_cad_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."chp_cad_centers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_characters" ADD CONSTRAINT "threed_characters_model_id_threed_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."threed_models"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_characters" ADD CONSTRAINT "threed_characters_bed_id_threed_beds_id_fk" FOREIGN KEY ("bed_id") REFERENCES "public"."threed_beds"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_farmbot_logs" ADD CONSTRAINT "threed_farmbot_logs_farmbot_id_threed_farmbots_id_fk" FOREIGN KEY ("farmbot_id") REFERENCES "public"."threed_farmbots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_farmbots" ADD CONSTRAINT "threed_farmbots_bed_id_threed_beds_id_fk" FOREIGN KEY ("bed_id") REFERENCES "public"."threed_beds"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_harvests" ADD CONSTRAINT "threed_harvests_planting_id_threed_plantings_id_fk" FOREIGN KEY ("planting_id") REFERENCES "public"."threed_plantings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_harvests" ADD CONSTRAINT "threed_harvests_plant_id_threed_plants_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."threed_plants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_model_files" ADD CONSTRAINT "threed_model_files_model_id_threed_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."threed_models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_plantings" ADD CONSTRAINT "threed_plantings_plant_id_threed_plants_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."threed_plants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_plantings" ADD CONSTRAINT "threed_plantings_bed_id_threed_beds_id_fk" FOREIGN KEY ("bed_id") REFERENCES "public"."threed_beds"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_plantings" ADD CONSTRAINT "threed_plantings_custom_model_id_threed_models_id_fk" FOREIGN KEY ("custom_model_id") REFERENCES "public"."threed_models"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_plants" ADD CONSTRAINT "threed_plants_model_id_threed_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."threed_models"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_tasks" ADD CONSTRAINT "threed_tasks_planting_id_threed_plantings_id_fk" FOREIGN KEY ("planting_id") REFERENCES "public"."threed_plantings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_tasks" ADD CONSTRAINT "threed_tasks_plant_id_threed_plants_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."threed_plants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_tasks" ADD CONSTRAINT "threed_tasks_bed_id_threed_beds_id_fk" FOREIGN KEY ("bed_id") REFERENCES "public"."threed_beds"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_tasks" ADD CONSTRAINT "threed_tasks_watering_schedule_id_threed_watering_schedules_id_fk" FOREIGN KEY ("watering_schedule_id") REFERENCES "public"."threed_watering_schedules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_watering_history" ADD CONSTRAINT "threed_watering_history_schedule_id_threed_watering_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."threed_watering_schedules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_watering_history" ADD CONSTRAINT "threed_watering_history_plant_id_threed_plants_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."threed_plants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_watering_history" ADD CONSTRAINT "threed_watering_history_farmbot_id_threed_farmbots_id_fk" FOREIGN KEY ("farmbot_id") REFERENCES "public"."threed_farmbots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_watering_history" ADD CONSTRAINT "threed_watering_history_planting_id_threed_plantings_id_fk" FOREIGN KEY ("planting_id") REFERENCES "public"."threed_plantings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_watering_schedules" ADD CONSTRAINT "threed_watering_schedules_plant_id_threed_plants_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."threed_plants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_watering_schedules" ADD CONSTRAINT "threed_watering_schedules_farmbot_id_threed_farmbots_id_fk" FOREIGN KEY ("farmbot_id") REFERENCES "public"."threed_farmbots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_watering_schedules" ADD CONSTRAINT "threed_watering_schedules_bed_id_threed_beds_id_fk" FOREIGN KEY ("bed_id") REFERENCES "public"."threed_beds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_watering_schedules" ADD CONSTRAINT "threed_watering_schedules_planting_id_threed_plantings_id_fk" FOREIGN KEY ("planting_id") REFERENCES "public"."threed_plantings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_api_logs_timestamp" ON "api_request_logs" USING btree ("request_timestamp");--> statement-breakpoint
CREATE INDEX "idx_api_logs_success" ON "api_request_logs" USING btree ("success");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_bay_area_source_id" ON "bay_area_traffic_events" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "idx_bay_area_type" ON "bay_area_traffic_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_bay_area_roadway" ON "bay_area_traffic_events" USING btree ("roadway_name");--> statement-breakpoint
CREATE INDEX "idx_bay_area_status" ON "bay_area_traffic_events" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_calfire_unique_id" ON "calfire_incidents" USING btree ("unique_id");--> statement-breakpoint
CREATE INDEX "idx_calfire_county" ON "calfire_incidents" USING btree ("county");--> statement-breakpoint
CREATE INDEX "idx_calfire_status" ON "calfire_incidents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_calfire_active" ON "calfire_incidents" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_districts_region" ON "caltrans_districts" USING btree ("region");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_chp_cad_centers_code" ON "chp_cad_centers" USING btree ("center_code");--> statement-breakpoint
CREATE INDEX "idx_chp_cad_centers_county" ON "chp_cad_centers" USING btree ("county");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_chp_cad_source_id" ON "chp_cad_incidents" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "idx_chp_cad_center_id" ON "chp_cad_incidents" USING btree ("center_id");--> statement-breakpoint
CREATE INDEX "idx_chp_cad_county" ON "chp_cad_incidents" USING btree ("county");--> statement-breakpoint
CREATE INDEX "idx_chp_cad_log_time" ON "chp_cad_incidents" USING btree ("log_time");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_chp_case_id" ON "chp_collisions" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "idx_chp_county" ON "chp_collisions" USING btree ("county");--> statement-breakpoint
CREATE INDEX "idx_chp_severity" ON "chp_collisions" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_chp_year" ON "chp_collisions" USING btree ("collision_year");--> statement-breakpoint
CREATE INDEX "idx_chp_date" ON "chp_collisions" USING btree ("collision_date");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_closures_source_id" ON "lane_closures" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "idx_closures_district" ON "lane_closures" USING btree ("district");--> statement-breakpoint
CREATE INDEX "idx_closures_route" ON "lane_closures" USING btree ("route");--> statement-breakpoint
CREATE INDEX "idx_closures_status" ON "lane_closures" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_closures_last_seen" ON "lane_closures" USING btree ("last_seen");--> statement-breakpoint
CREATE INDEX "idx_closures_dates" ON "lane_closures" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "idx_snapshots_timestamp" ON "lane_closures_snapshots" USING btree ("snapshot_timestamp");--> statement-breakpoint
CREATE INDEX "idx_snapshots_district" ON "lane_closures_snapshots" USING btree ("district");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_threed_beds_bed_id" ON "threed_beds" USING btree ("bed_id");--> statement-breakpoint
CREATE INDEX "idx_threed_beds_active" ON "threed_beds" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_threed_beds_name" ON "threed_beds" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_threed_characters_character_id" ON "threed_characters" USING btree ("character_id");--> statement-breakpoint
CREATE INDEX "idx_threed_characters_name" ON "threed_characters" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_threed_characters_type" ON "threed_characters" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_threed_characters_status" ON "threed_characters" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_threed_characters_movement_type" ON "threed_characters" USING btree ("movement_type");--> statement-breakpoint
CREATE INDEX "idx_threed_characters_model" ON "threed_characters" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "idx_threed_characters_bed" ON "threed_characters" USING btree ("bed_id");--> statement-breakpoint
CREATE INDEX "idx_threed_characters_visible" ON "threed_characters" USING btree ("visible");--> statement-breakpoint
CREATE INDEX "idx_threed_farmbot_logs_farmbot" ON "threed_farmbot_logs" USING btree ("farmbot_id");--> statement-breakpoint
CREATE INDEX "idx_threed_farmbot_logs_event_type" ON "threed_farmbot_logs" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_threed_farmbot_logs_logged_at" ON "threed_farmbot_logs" USING btree ("logged_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_threed_farmbots_device_id" ON "threed_farmbots" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "idx_threed_farmbots_status" ON "threed_farmbots" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_threed_harvests_harvest_id" ON "threed_harvests" USING btree ("harvest_id");--> statement-breakpoint
CREATE INDEX "idx_threed_harvests_planting" ON "threed_harvests" USING btree ("planting_id");--> statement-breakpoint
CREATE INDEX "idx_threed_harvests_date" ON "threed_harvests" USING btree ("harvest_date");--> statement-breakpoint
CREATE INDEX "idx_threed_model_files_model_id" ON "threed_model_files" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "idx_threed_model_files_type" ON "threed_model_files" USING btree ("file_type");--> statement-breakpoint
CREATE INDEX "idx_threed_models_type" ON "threed_models" USING btree ("model_type");--> statement-breakpoint
CREATE INDEX "idx_threed_models_active" ON "threed_models" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_threed_plantings_planting_id" ON "threed_plantings" USING btree ("planting_id");--> statement-breakpoint
CREATE INDEX "idx_threed_plantings_plant" ON "threed_plantings" USING btree ("plant_id");--> statement-breakpoint
CREATE INDEX "idx_threed_plantings_bed" ON "threed_plantings" USING btree ("bed_id");--> statement-breakpoint
CREATE INDEX "idx_threed_plantings_status" ON "threed_plantings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_threed_plantings_custom_model" ON "threed_plantings" USING btree ("custom_model_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_threed_plants_plant_id" ON "threed_plants" USING btree ("plant_id");--> statement-breakpoint
CREATE INDEX "idx_threed_plants_common_name" ON "threed_plants" USING btree ("common_name");--> statement-breakpoint
CREATE INDEX "idx_threed_plants_type" ON "threed_plants" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_threed_plants_status" ON "threed_plants" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_threed_system_logs_level" ON "threed_system_logs" USING btree ("level");--> statement-breakpoint
CREATE INDEX "idx_threed_system_logs_logged_at" ON "threed_system_logs" USING btree ("logged_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_threed_tasks_task_id" ON "threed_tasks" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_threed_tasks_planting" ON "threed_tasks" USING btree ("planting_id");--> statement-breakpoint
CREATE INDEX "idx_threed_tasks_due_date" ON "threed_tasks" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "idx_threed_tasks_status" ON "threed_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_threed_tasks_watering" ON "threed_tasks" USING btree ("watering_schedule_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_threed_watering_history_id" ON "threed_watering_history" USING btree ("history_id");--> statement-breakpoint
CREATE INDEX "idx_threed_watering_history_schedule" ON "threed_watering_history" USING btree ("schedule_id");--> statement-breakpoint
CREATE INDEX "idx_threed_watering_history_plant" ON "threed_watering_history" USING btree ("plant_id");--> statement-breakpoint
CREATE INDEX "idx_threed_watering_history_executed_at" ON "threed_watering_history" USING btree ("executed_at");--> statement-breakpoint
CREATE INDEX "idx_threed_watering_history_status" ON "threed_watering_history" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_threed_watering_schedule_id" ON "threed_watering_schedules" USING btree ("schedule_id");--> statement-breakpoint
CREATE INDEX "idx_threed_watering_plant" ON "threed_watering_schedules" USING btree ("plant_id");--> statement-breakpoint
CREATE INDEX "idx_threed_watering_farmbot" ON "threed_watering_schedules" USING btree ("farmbot_id");--> statement-breakpoint
CREATE INDEX "idx_threed_watering_next" ON "threed_watering_schedules" USING btree ("next_watering");--> statement-breakpoint
CREATE INDEX "idx_threed_watering_active" ON "threed_watering_schedules" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_threed_watering_next_active" ON "threed_watering_schedules" USING btree ("next_watering","is_active");--> statement-breakpoint
CREATE INDEX "idx_threed_weather_recorded_at" ON "threed_weather_logs" USING btree ("recorded_at");