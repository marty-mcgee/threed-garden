CREATE TYPE "public"."album_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."asset_type" AS ENUM('music_albums', 'music_tracks', 'music_links', 'music_media', 'threed_plants', 'threed_beds', 'threed_layers', 'threed_markers', 'threed_models', 'threed_characters', 'threed_tasks', 'threed_harvests', 'threed_weather_logs', 'threed_farmbots', 'threed_watering_schedules', 'traffic_chp_cad_incidents', 'traffic_chp_cases', 'traffic_caltrans_lane_closures', 'traffic_caltrans_cctv_cameras', 'traffic_bay_area_511_events', 'traffic_calfire_incidents');--> statement-breakpoint
CREATE TYPE "public"."threed_bed_shape" AS ENUM('rectangle', 'square', 'circle', 'raised', 'container', 'custom');--> statement-breakpoint
CREATE TYPE "public"."threed_character_animation" AS ENUM('idle', 'walk', 'run', 'fly', 'dance', 'sway', 'float', 'spin', 'bounce');--> statement-breakpoint
CREATE TYPE "public"."threed_character_emote" AS ENUM('none', 'happy', 'sad', 'surprised', 'angry', 'wave', 'dance', 'sleep');--> statement-breakpoint
CREATE TYPE "public"."threed_character_movement_type" AS ENUM('stationary', 'wander', 'patrol', 'circle', 'follow', 'teleport');--> statement-breakpoint
CREATE TYPE "public"."threed_character_status" AS ENUM('active', 'idle', 'sleeping', 'moving', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."threed_character_type" AS ENUM('animal', 'bird', 'insect', 'mythical', 'human', 'robot', 'decoration');--> statement-breakpoint
CREATE TYPE "public"."threed_character_weather_sensitivity" AS ENUM('all', 'sunny_only', 'rainy_only', 'no_rain', 'no_snow');--> statement-breakpoint
CREATE TYPE "public"."closure_status" AS ENUM('active', 'cleared', 'planned', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."deployment_environment" AS ENUM('development', 'staging', 'production');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('accident', 'hazard', 'weather', 'construction', 'special_event', 'other');--> statement-breakpoint
CREATE TYPE "public"."threed_farmbot_status" AS ENUM('online', 'offline', 'maintenance', 'error');--> statement-breakpoint
CREATE TYPE "public"."threed_growth_stage" AS ENUM('seed', 'seedling', 'vegetative', 'flowering', 'fruiting', 'mature', 'dormant');--> statement-breakpoint
CREATE TYPE "public"."incident_status" AS ENUM('active', 'cleared', 'pending', 'closed');--> statement-breakpoint
CREATE TYPE "public"."threed_layer_type" AS ENUM('garden', 'plants', 'beds', 'farmbots', 'models', 'characters', 'tasks', 'weather', 'traffic', 'custom');--> statement-breakpoint
CREATE TYPE "public"."threed_layer_visibility" AS ENUM('public', 'private', 'shared');--> statement-breakpoint
CREATE TYPE "public"."threed_marker_status" AS ENUM('active', 'inactive', 'archived', 'pending');--> statement-breakpoint
CREATE TYPE "public"."threed_marker_type" AS ENUM('plant', 'bed', 'farmbot', 'model', 'character', 'task', 'weather_station', 'traffic_incident', 'custom');--> statement-breakpoint
CREATE TYPE "public"."threed_model_type" AS ENUM('procedural', 'gltf', 'glb', 'fbx', 'usdz', 'obj', 'herb-generic', 'vegetable-generic', 'flower-generic', 'fruit-generic', 'tree-generic', 'custom');--> statement-breakpoint
CREATE TYPE "public"."music_link_status" AS ENUM('active', 'inactive', 'pending', 'expired');--> statement-breakpoint
CREATE TYPE "public"."music_link_type" AS ENUM('external', 'social', 'buy', 'stream', 'video');--> statement-breakpoint
CREATE TYPE "public"."music_polling_type" AS ENUM('metadata', 'stats', 'sync');--> statement-breakpoint
CREATE TYPE "public"."threed_plant_status" AS ENUM('active', 'inactive', 'archived');--> statement-breakpoint
CREATE TYPE "public"."threed_plant_type" AS ENUM('Vegetable', 'Fruit', 'Herb', 'Flower', 'Tree', 'Shrub', 'CoverCrop');--> statement-breakpoint
CREATE TYPE "public"."threed_planting_status" AS ENUM('planned', 'planted', 'growing', 'harvesting', 'harvested', 'failed');--> statement-breakpoint
CREATE TYPE "public"."setting_scope" AS ENUM('system', 'user', 'module');--> statement-breakpoint
CREATE TYPE "public"."setting_type" AS ENUM('boolean', 'string', 'number', 'json', 'array');--> statement-breakpoint
CREATE TYPE "public"."threed_task_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."threed_task_status" AS ENUM('pending', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."track_status" AS ENUM('active', 'inactive', 'processing');--> statement-breakpoint
CREATE TYPE "public"."threed_watering_frequency" AS ENUM('daily', 'weekly', 'custom', 'moisture-based', 'hourly', 'bi-daily');--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" timestamp,
	"image" text,
	"username" text,
	"display_name" text,
	"bio" text,
	"theme" text DEFAULT 'system',
	"language" text DEFAULT 'en',
	"timezone" text DEFAULT 'UTC',
	"role" text DEFAULT 'user',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "user_accounts" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	"password" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_token" text NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "user_verifications" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "music" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"description" text,
	"slug" text NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true,
	"is_public" boolean DEFAULT false,
	"version" text DEFAULT '1.0.0',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "music_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "music_albums" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"title" text NOT NULL,
	"artist" text NOT NULL,
	"cover_art" text NOT NULL,
	"release_year" integer,
	"description" text,
	"sort_order" integer DEFAULT 0,
	"status" "album_status" DEFAULT 'draft',
	"is_public" boolean DEFAULT false,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "music_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"type" "music_link_type" DEFAULT 'external',
	"icon" text,
	"description" text,
	"status" "music_link_status" DEFAULT 'active',
	"display_order" integer DEFAULT 0,
	"metadata" jsonb,
	"album_id" integer,
	"track_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "music_media" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"album_id" integer NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" integer,
	"is_primary" boolean DEFAULT true,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "music_playback_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"track_id" integer,
	"album_id" integer,
	"played_at" timestamp DEFAULT now(),
	"play_duration" integer,
	"completed" boolean DEFAULT false,
	"source" text DEFAULT 'music_player'
);
--> statement-breakpoint
CREATE TABLE "music_polling_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"poll_type" "music_polling_type" NOT NULL,
	"status" text NOT NULL,
	"message" text,
	"metadata" jsonb,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "music_tracks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"album_id" integer,
	"title" text NOT NULL,
	"duration" integer,
	"track_number" integer,
	"public_url" text NOT NULL,
	"status" "track_status" DEFAULT 'active',
	"lyrics" text,
	"metadata" jsonb,
	"play_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"description" text,
	"slug" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"is_public" boolean DEFAULT false,
	"config" jsonb DEFAULT '{}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "project_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "project_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"project_id" integer,
	"module_id" integer NOT NULL,
	"module_type" text NOT NULL,
	"asset_type" "asset_type" NOT NULL,
	"asset_id" integer NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project_music" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"project_id" integer,
	"music_id" integer,
	"config" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project_threed" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"project_id" integer,
	"threed_id" integer,
	"config" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project_traffic" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"project_id" integer,
	"traffic_id" integer,
	"config" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"scope" "setting_scope" DEFAULT 'system' NOT NULL,
	"value" jsonb NOT NULL,
	"type" "setting_type" DEFAULT 'string' NOT NULL,
	"label" text,
	"description" text,
	"group" text,
	"category" text,
	"is_required" boolean DEFAULT false,
	"is_sensitive" boolean DEFAULT false,
	"is_enabled" boolean DEFAULT true,
	"validation" jsonb,
	"default_value" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "settings_audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"setting_id" integer,
	"user_id" text,
	"action" text NOT NULL,
	"old_value" jsonb,
	"new_value" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "settings_deployment" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"environment" "deployment_environment" DEFAULT 'development',
	"description" text,
	"is_active" boolean DEFAULT false,
	"settings" jsonb NOT NULL,
	"version" text DEFAULT '1.0.0',
	"deployed_by" text,
	"deployed_at" timestamp,
	"rollback_to" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "settings_deployment_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "settings_deployment_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"deployment_id" integer,
	"action" text NOT NULL,
	"previous_deployment_id" integer,
	"new_deployment_id" integer,
	"performed_by" text,
	"changes" jsonb,
	"performed_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "settings_user_overrides" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"setting_id" integer,
	"value" jsonb NOT NULL,
	"override_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "threed" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"project_id" integer,
	"name" text NOT NULL,
	"description" text,
	"slug" text NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true,
	"is_public" boolean DEFAULT false,
	"version" text DEFAULT '1.0.0',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "threed_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "threed_beds" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
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
	"marker_id" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "threed_beds_bed_id_unique" UNIQUE("bed_id")
);
--> statement-breakpoint
CREATE TABLE "threed_character_models" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"character_id" integer,
	"model_id" integer,
	"config" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "threed_characters" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"character_id" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" "threed_character_type" DEFAULT 'animal',
	"status" "threed_character_status" DEFAULT 'active',
	"model_id" integer,
	"marker_id" integer,
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
	"user_id" text,
	"farmbot_id" integer,
	"event_type" varchar(50),
	"status" varchar(20),
	"message" text,
	"sensor_data" jsonb,
	"raw_data" jsonb,
	"logged_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "threed_farmbots" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
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
	"marker_id" integer,
	"is_active" boolean DEFAULT true,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "threed_farmbots_device_id_unique" UNIQUE("device_id")
);
--> statement-breakpoint
CREATE TABLE "threed_harvests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
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
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "threed_harvests_harvest_id_unique" UNIQUE("harvest_id")
);
--> statement-breakpoint
CREATE TABLE "threed_layer_presets" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"layer_ids" jsonb,
	"config" jsonb,
	"user_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "threed_layers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"description" text,
	"type" "threed_layer_type" DEFAULT 'custom' NOT NULL,
	"is_enabled" boolean DEFAULT true,
	"visibility" "threed_layer_visibility" DEFAULT 'public',
	"icon" text,
	"color" text,
	"order_index" integer DEFAULT 0,
	"config" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "threed_marker_relationships" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_marker_id" integer,
	"child_marker_id" integer,
	"relationship_type" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "threed_markers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"description" text,
	"type" "threed_marker_type" NOT NULL,
	"status" "threed_marker_status" DEFAULT 'active',
	"layer_id" integer,
	"position_x" real DEFAULT 0,
	"position_y" real DEFAULT 0,
	"position_z" real DEFAULT 0,
	"rotation_x" real DEFAULT 0,
	"rotation_y" real DEFAULT 0,
	"rotation_z" real DEFAULT 0,
	"scale_x" real DEFAULT 1,
	"scale_y" real DEFAULT 1,
	"scale_z" real DEFAULT 1,
	"source_type" text,
	"source_id" integer,
	"icon" text,
	"color" text,
	"size" real DEFAULT 1,
	"custom_data" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "threed_model_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"model_id" integer,
	"file_name" varchar(255) NOT NULL,
	"file_type" varchar(50) NOT NULL,
	"texture_type" varchar(50),
	"file_path" varchar(500) NOT NULL,
	"file_size" integer,
	"is_binary_buffer" boolean DEFAULT false,
	"load_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "threed_models" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
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
	"marker_id" integer,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "threed_plantings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
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
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "threed_plantings_planting_id_unique" UNIQUE("planting_id")
);
--> statement-breakpoint
CREATE TABLE "threed_plants" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"plant_id" varchar(50) NOT NULL,
	"common_name" varchar(255) NOT NULL,
	"scientific_name" varchar(255),
	"variety" varchar(100),
	"family" varchar(100),
	"type" "threed_plant_type" DEFAULT 'Vegetable',
	"status" "threed_plant_status" DEFAULT 'active',
	"model_id" integer,
	"marker_id" integer,
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
	"user_id" text,
	"level" varchar(20),
	"source" varchar(100),
	"message" text,
	"details" jsonb,
	"logged_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "threed_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"task_id" varchar(50) NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"type" varchar(50),
	"priority" "threed_task_priority" DEFAULT 'medium',
	"status" "threed_task_status" DEFAULT 'pending',
	"due_date" timestamp,
	"completed_at" timestamp,
	"planting_id" integer,
	"plant_id" integer,
	"bed_id" integer,
	"watering_schedule_id" integer,
	"marker_id" integer,
	"assigned_to" varchar(100),
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "threed_tasks_task_id_unique" UNIQUE("task_id")
);
--> statement-breakpoint
CREATE TABLE "threed_watering_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
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
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "threed_watering_history_history_id_unique" UNIQUE("history_id")
);
--> statement-breakpoint
CREATE TABLE "threed_watering_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
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
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "threed_watering_schedules_schedule_id_unique" UNIQUE("schedule_id")
);
--> statement-breakpoint
CREATE TABLE "threed_weather_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
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
	"marker_id" integer,
	"source" varchar(50) DEFAULT 'api',
	"raw_data" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "traffic" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"description" text,
	"slug" text NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true,
	"is_public" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "traffic_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "traffic_api_request_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"endpoint" text NOT NULL,
	"status_code" integer,
	"duration_ms" integer,
	"request_data" jsonb,
	"response_data" jsonb,
	"error" text,
	"source" varchar(50),
	"is_success" boolean DEFAULT true,
	"logged_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "traffic_bay_area_511_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"event_id" varchar(50) NOT NULL,
	"event_type" "event_type" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"severity" varchar(20),
	"status" "incident_status" DEFAULT 'active',
	"location" text NOT NULL,
	"city" text,
	"county" text,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"route" text,
	"direction" text,
	"milepost" numeric(8, 2),
	"area" text,
	"affected_roads" jsonb DEFAULT '[]'::jsonb,
	"impact" text,
	"advice" text,
	"raw_data" jsonb,
	"source" varchar(50) DEFAULT '511',
	"occurred_at" timestamp NOT NULL,
	"cleared_at" timestamp,
	"last_updated" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "traffic_bay_area_511_events_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "traffic_calfire_incidents" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"incident_id" varchar(50) NOT NULL,
	"incident_name" text NOT NULL,
	"incident_type" text,
	"status" "incident_status" DEFAULT 'active',
	"severity" varchar(20),
	"description" text,
	"location" text NOT NULL,
	"county" text,
	"state" varchar(2) DEFAULT 'CA',
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"fire_size" numeric(10, 1),
	"fire_size_unit" varchar(10) DEFAULT 'acres',
	"containment" integer,
	"cause" text,
	"personnel" integer,
	"engines" integer,
	"dozers" integer,
	"aircraft" integer,
	"crews" integer,
	"raw_data" jsonb,
	"source" varchar(50) DEFAULT 'calfire',
	"started_at" timestamp NOT NULL,
	"contained_at" timestamp,
	"last_updated" timestamp NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "traffic_calfire_incidents_incident_id_unique" UNIQUE("incident_id")
);
--> statement-breakpoint
CREATE TABLE "traffic_caltrans_cctv_cameras" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"camera_id" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"location" text NOT NULL,
	"city" text,
	"county" text,
	"state" varchar(2) DEFAULT 'CA',
	"latitude" numeric(10, 7) NOT NULL,
	"longitude" numeric(10, 7) NOT NULL,
	"camera_type" text,
	"status" varchar(20) DEFAULT 'active',
	"direction" text,
	"route" text,
	"milepost" numeric(8, 2),
	"image_url" text,
	"stream_url" text,
	"thumbnail_url" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"raw_data" jsonb,
	"last_image_update" timestamp,
	"last_status_update" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "traffic_caltrans_cctv_cameras_camera_id_unique" UNIQUE("camera_id")
);
--> statement-breakpoint
CREATE TABLE "traffic_caltrans_districts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"district_id" varchar(20) NOT NULL,
	"name" text NOT NULL,
	"number" integer,
	"region" text,
	"counties" jsonb DEFAULT '[]'::jsonb,
	"phone" text,
	"email" text,
	"address" text,
	"website" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "traffic_caltrans_districts_district_id_unique" UNIQUE("district_id"),
	CONSTRAINT "traffic_caltrans_districts_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "traffic_caltrans_lane_closures" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"closure_id" varchar(50) NOT NULL,
	"district" varchar(10),
	"route" varchar(20),
	"type" text NOT NULL,
	"status" "closure_status" DEFAULT 'active',
	"description" text,
	"location" text NOT NULL,
	"county" text,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"start_latitude" numeric(10, 7),
	"start_longitude" numeric(10, 7),
	"end_latitude" numeric(10, 7),
	"end_longitude" numeric(10, 7),
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"expected_end_date" timestamp,
	"lanes_closed" jsonb DEFAULT '[]'::jsonb,
	"impact" text,
	"detour" text,
	"raw_data" jsonb,
	"source" varchar(50) DEFAULT 'cwwp2',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "traffic_caltrans_lane_closures_closure_id_unique" UNIQUE("closure_id")
);
--> statement-breakpoint
CREATE TABLE "traffic_chp_cad_centers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"center_id" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"code" varchar(20),
	"city" text,
	"county" text,
	"state" varchar(2) DEFAULT 'CA',
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"phone" text,
	"address" text,
	"website" text,
	"is_active" boolean DEFAULT true,
	"raw_data" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "traffic_chp_cad_centers_center_id_unique" UNIQUE("center_id")
);
--> statement-breakpoint
CREATE TABLE "traffic_chp_cad_incidents" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"incident_id" varchar(50) NOT NULL,
	"log_number" varchar(50),
	"cad_number" varchar(50),
	"type" text NOT NULL,
	"subtype" text,
	"status" "incident_status" DEFAULT 'active',
	"priority" varchar(10),
	"location" text NOT NULL,
	"city" text,
	"county" text,
	"state" varchar(2) DEFAULT 'CA',
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"chp_unit" text,
	"responding_units" jsonb DEFAULT '[]'::jsonb,
	"log_text" text,
	"raw_data" jsonb,
	"reported_at" timestamp NOT NULL,
	"cleared_at" timestamp,
	"last_updated" timestamp NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "traffic_chp_cad_incidents_incident_id_unique" UNIQUE("incident_id")
);
--> statement-breakpoint
CREATE TABLE "traffic_chp_cases" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"case_id" varchar(50) NOT NULL,
	"log_number" varchar(50),
	"collision_number" varchar(50),
	"type" text NOT NULL,
	"severity" varchar(20),
	"status" "incident_status" DEFAULT 'closed',
	"location" text NOT NULL,
	"city" text,
	"county" text,
	"state" varchar(2) DEFAULT 'CA',
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"collision_type" text,
	"weather_conditions" text,
	"road_conditions" text,
	"lighting_conditions" text,
	"injuries" integer DEFAULT 0,
	"fatalities" integer DEFAULT 0,
	"vehicles_involved" integer DEFAULT 0,
	"parties_involved" integer DEFAULT 0,
	"raw_data" jsonb,
	"source" varchar(50) DEFAULT 'ckan',
	"occurred_at" timestamp NOT NULL,
	"reported_at" timestamp,
	"last_updated" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "traffic_chp_cases_case_id_unique" UNIQUE("case_id")
);
--> statement-breakpoint
ALTER TABLE "user_accounts" ADD CONSTRAINT "user_accounts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music" ADD CONSTRAINT "music_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_albums" ADD CONSTRAINT "music_albums_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_links" ADD CONSTRAINT "music_links_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_links" ADD CONSTRAINT "music_links_album_id_music_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."music_albums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_links" ADD CONSTRAINT "music_links_track_id_music_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."music_tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_media" ADD CONSTRAINT "music_media_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_media" ADD CONSTRAINT "music_media_album_id_music_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."music_albums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_playback_history" ADD CONSTRAINT "music_playback_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_playback_history" ADD CONSTRAINT "music_playback_history_track_id_music_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."music_tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_playback_history" ADD CONSTRAINT "music_playback_history_album_id_music_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."music_albums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_polling_logs" ADD CONSTRAINT "music_polling_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_tracks" ADD CONSTRAINT "music_tracks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_tracks" ADD CONSTRAINT "music_tracks_album_id_music_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."music_albums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_assets" ADD CONSTRAINT "project_assets_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_assets" ADD CONSTRAINT "project_assets_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_music" ADD CONSTRAINT "project_music_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_music" ADD CONSTRAINT "project_music_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_music" ADD CONSTRAINT "project_music_music_id_music_id_fk" FOREIGN KEY ("music_id") REFERENCES "public"."music"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_threed" ADD CONSTRAINT "project_threed_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_threed" ADD CONSTRAINT "project_threed_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_threed" ADD CONSTRAINT "project_threed_threed_id_threed_id_fk" FOREIGN KEY ("threed_id") REFERENCES "public"."threed"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_traffic" ADD CONSTRAINT "project_traffic_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_traffic" ADD CONSTRAINT "project_traffic_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_traffic" ADD CONSTRAINT "project_traffic_traffic_id_traffic_id_fk" FOREIGN KEY ("traffic_id") REFERENCES "public"."traffic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings_audit_logs" ADD CONSTRAINT "settings_audit_logs_setting_id_settings_id_fk" FOREIGN KEY ("setting_id") REFERENCES "public"."settings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings_audit_logs" ADD CONSTRAINT "settings_audit_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings_deployment" ADD CONSTRAINT "settings_deployment_rollback_to_settings_deployment_id_fk" FOREIGN KEY ("rollback_to") REFERENCES "public"."settings_deployment"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings_deployment_history" ADD CONSTRAINT "settings_deployment_history_deployment_id_settings_deployment_id_fk" FOREIGN KEY ("deployment_id") REFERENCES "public"."settings_deployment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings_user_overrides" ADD CONSTRAINT "settings_user_overrides_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings_user_overrides" ADD CONSTRAINT "settings_user_overrides_setting_id_settings_id_fk" FOREIGN KEY ("setting_id") REFERENCES "public"."settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed" ADD CONSTRAINT "threed_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed" ADD CONSTRAINT "threed_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_beds" ADD CONSTRAINT "threed_beds_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_beds" ADD CONSTRAINT "threed_beds_marker_id_threed_markers_id_fk" FOREIGN KEY ("marker_id") REFERENCES "public"."threed_markers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_character_models" ADD CONSTRAINT "threed_character_models_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_character_models" ADD CONSTRAINT "threed_character_models_character_id_threed_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."threed_characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_character_models" ADD CONSTRAINT "threed_character_models_model_id_threed_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."threed_models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_characters" ADD CONSTRAINT "threed_characters_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_characters" ADD CONSTRAINT "threed_characters_model_id_threed_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."threed_models"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_characters" ADD CONSTRAINT "threed_characters_marker_id_threed_markers_id_fk" FOREIGN KEY ("marker_id") REFERENCES "public"."threed_markers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_characters" ADD CONSTRAINT "threed_characters_bed_id_threed_beds_id_fk" FOREIGN KEY ("bed_id") REFERENCES "public"."threed_beds"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_farmbot_logs" ADD CONSTRAINT "threed_farmbot_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_farmbot_logs" ADD CONSTRAINT "threed_farmbot_logs_farmbot_id_threed_farmbots_id_fk" FOREIGN KEY ("farmbot_id") REFERENCES "public"."threed_farmbots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_farmbots" ADD CONSTRAINT "threed_farmbots_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_farmbots" ADD CONSTRAINT "threed_farmbots_bed_id_threed_beds_id_fk" FOREIGN KEY ("bed_id") REFERENCES "public"."threed_beds"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_farmbots" ADD CONSTRAINT "threed_farmbots_marker_id_threed_markers_id_fk" FOREIGN KEY ("marker_id") REFERENCES "public"."threed_markers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_harvests" ADD CONSTRAINT "threed_harvests_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_harvests" ADD CONSTRAINT "threed_harvests_planting_id_threed_plantings_id_fk" FOREIGN KEY ("planting_id") REFERENCES "public"."threed_plantings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_harvests" ADD CONSTRAINT "threed_harvests_plant_id_threed_plants_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."threed_plants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_layer_presets" ADD CONSTRAINT "threed_layer_presets_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_layers" ADD CONSTRAINT "threed_layers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_marker_relationships" ADD CONSTRAINT "threed_marker_relationships_parent_marker_id_threed_markers_id_fk" FOREIGN KEY ("parent_marker_id") REFERENCES "public"."threed_markers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_marker_relationships" ADD CONSTRAINT "threed_marker_relationships_child_marker_id_threed_markers_id_fk" FOREIGN KEY ("child_marker_id") REFERENCES "public"."threed_markers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_markers" ADD CONSTRAINT "threed_markers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_markers" ADD CONSTRAINT "threed_markers_layer_id_threed_layers_id_fk" FOREIGN KEY ("layer_id") REFERENCES "public"."threed_layers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_model_files" ADD CONSTRAINT "threed_model_files_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_model_files" ADD CONSTRAINT "threed_model_files_model_id_threed_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."threed_models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_models" ADD CONSTRAINT "threed_models_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_models" ADD CONSTRAINT "threed_models_marker_id_threed_markers_id_fk" FOREIGN KEY ("marker_id") REFERENCES "public"."threed_markers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_plantings" ADD CONSTRAINT "threed_plantings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_plantings" ADD CONSTRAINT "threed_plantings_plant_id_threed_plants_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."threed_plants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_plantings" ADD CONSTRAINT "threed_plantings_bed_id_threed_beds_id_fk" FOREIGN KEY ("bed_id") REFERENCES "public"."threed_beds"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_plantings" ADD CONSTRAINT "threed_plantings_custom_model_id_threed_models_id_fk" FOREIGN KEY ("custom_model_id") REFERENCES "public"."threed_models"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_plants" ADD CONSTRAINT "threed_plants_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_plants" ADD CONSTRAINT "threed_plants_model_id_threed_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."threed_models"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_plants" ADD CONSTRAINT "threed_plants_marker_id_threed_markers_id_fk" FOREIGN KEY ("marker_id") REFERENCES "public"."threed_markers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_system_logs" ADD CONSTRAINT "threed_system_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_tasks" ADD CONSTRAINT "threed_tasks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_tasks" ADD CONSTRAINT "threed_tasks_planting_id_threed_plantings_id_fk" FOREIGN KEY ("planting_id") REFERENCES "public"."threed_plantings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_tasks" ADD CONSTRAINT "threed_tasks_plant_id_threed_plants_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."threed_plants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_tasks" ADD CONSTRAINT "threed_tasks_bed_id_threed_beds_id_fk" FOREIGN KEY ("bed_id") REFERENCES "public"."threed_beds"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_tasks" ADD CONSTRAINT "threed_tasks_watering_schedule_id_threed_watering_schedules_id_fk" FOREIGN KEY ("watering_schedule_id") REFERENCES "public"."threed_watering_schedules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_tasks" ADD CONSTRAINT "threed_tasks_marker_id_threed_markers_id_fk" FOREIGN KEY ("marker_id") REFERENCES "public"."threed_markers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_watering_history" ADD CONSTRAINT "threed_watering_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_watering_history" ADD CONSTRAINT "threed_watering_history_schedule_id_threed_watering_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."threed_watering_schedules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_watering_history" ADD CONSTRAINT "threed_watering_history_plant_id_threed_plants_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."threed_plants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_watering_history" ADD CONSTRAINT "threed_watering_history_farmbot_id_threed_farmbots_id_fk" FOREIGN KEY ("farmbot_id") REFERENCES "public"."threed_farmbots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_watering_history" ADD CONSTRAINT "threed_watering_history_planting_id_threed_plantings_id_fk" FOREIGN KEY ("planting_id") REFERENCES "public"."threed_plantings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_watering_schedules" ADD CONSTRAINT "threed_watering_schedules_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_watering_schedules" ADD CONSTRAINT "threed_watering_schedules_plant_id_threed_plants_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."threed_plants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_watering_schedules" ADD CONSTRAINT "threed_watering_schedules_farmbot_id_threed_farmbots_id_fk" FOREIGN KEY ("farmbot_id") REFERENCES "public"."threed_farmbots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_watering_schedules" ADD CONSTRAINT "threed_watering_schedules_bed_id_threed_beds_id_fk" FOREIGN KEY ("bed_id") REFERENCES "public"."threed_beds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_watering_schedules" ADD CONSTRAINT "threed_watering_schedules_planting_id_threed_plantings_id_fk" FOREIGN KEY ("planting_id") REFERENCES "public"."threed_plantings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_weather_logs" ADD CONSTRAINT "threed_weather_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_weather_logs" ADD CONSTRAINT "threed_weather_logs_marker_id_threed_markers_id_fk" FOREIGN KEY ("marker_id") REFERENCES "public"."threed_markers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traffic" ADD CONSTRAINT "traffic_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traffic_api_request_logs" ADD CONSTRAINT "traffic_api_request_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traffic_bay_area_511_events" ADD CONSTRAINT "traffic_bay_area_511_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traffic_calfire_incidents" ADD CONSTRAINT "traffic_calfire_incidents_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traffic_caltrans_cctv_cameras" ADD CONSTRAINT "traffic_caltrans_cctv_cameras_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traffic_caltrans_districts" ADD CONSTRAINT "traffic_caltrans_districts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traffic_caltrans_lane_closures" ADD CONSTRAINT "traffic_caltrans_lane_closures_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traffic_chp_cad_centers" ADD CONSTRAINT "traffic_chp_cad_centers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traffic_chp_cad_incidents" ADD CONSTRAINT "traffic_chp_cad_incidents_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traffic_chp_cases" ADD CONSTRAINT "traffic_chp_cases_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_email" ON "user" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_username" ON "user" USING btree ("username");--> statement-breakpoint
CREATE INDEX "idx_user_accounts_user_id" ON "user_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_accounts_provider" ON "user_accounts" USING btree ("provider","provider_account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_sessions_token" ON "user_sessions" USING btree ("session_token");--> statement-breakpoint
CREATE INDEX "idx_user_sessions_user_id" ON "user_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_verifications_token" ON "user_verifications" USING btree ("identifier","token");--> statement-breakpoint
CREATE INDEX "idx_music_user_id" ON "music" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_music_slug" ON "music" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_music_active" ON "music" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "music_albums_user_id_idx" ON "music_albums" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "music_albums_status_idx" ON "music_albums" USING btree ("status");--> statement-breakpoint
CREATE INDEX "music_albums_sort_order_idx" ON "music_albums" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "music_links_user_id_idx" ON "music_links" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "music_links_type_idx" ON "music_links" USING btree ("type");--> statement-breakpoint
CREATE INDEX "music_links_album_id_idx" ON "music_links" USING btree ("album_id");--> statement-breakpoint
CREATE INDEX "music_links_track_id_idx" ON "music_links" USING btree ("track_id");--> statement-breakpoint
CREATE INDEX "music_links_status_idx" ON "music_links" USING btree ("status");--> statement-breakpoint
CREATE INDEX "music_media_user_id_idx" ON "music_media" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "music_media_album_id_idx" ON "music_media" USING btree ("album_id");--> statement-breakpoint
CREATE INDEX "music_media_is_primary_idx" ON "music_media" USING btree ("is_primary");--> statement-breakpoint
CREATE INDEX "music_playback_user_id_idx" ON "music_playback_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "music_playback_track_id_idx" ON "music_playback_history" USING btree ("track_id");--> statement-breakpoint
CREATE INDEX "music_playback_played_at_idx" ON "music_playback_history" USING btree ("played_at");--> statement-breakpoint
CREATE INDEX "music_polling_logs_type_idx" ON "music_polling_logs" USING btree ("poll_type");--> statement-breakpoint
CREATE INDEX "music_polling_logs_status_idx" ON "music_polling_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "music_polling_logs_type_status_idx" ON "music_polling_logs" USING btree ("poll_type","status");--> statement-breakpoint
CREATE INDEX "music_tracks_album_id_idx" ON "music_tracks" USING btree ("album_id");--> statement-breakpoint
CREATE INDEX "music_tracks_status_idx" ON "music_tracks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_projects_user_id" ON "project" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_projects_slug" ON "project" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_projects_active" ON "project" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_project_assets_project_id" ON "project_assets" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_project_assets_module_id" ON "project_assets" USING btree ("module_id");--> statement-breakpoint
CREATE INDEX "idx_project_assets_asset_type" ON "project_assets" USING btree ("asset_type");--> statement-breakpoint
CREATE INDEX "idx_project_assets_composite" ON "project_assets" USING btree ("project_id","module_type","asset_type","asset_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_project_assets_unique" ON "project_assets" USING btree ("project_id","module_id","asset_type","asset_id");--> statement-breakpoint
CREATE INDEX "idx_project_music_project_id" ON "project_music" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_project_music_music_id" ON "project_music" USING btree ("music_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_project_music_unique" ON "project_music" USING btree ("project_id","music_id");--> statement-breakpoint
CREATE INDEX "idx_project_threed_project_id" ON "project_threed" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_project_threed_threed_id" ON "project_threed" USING btree ("threed_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_project_threed_unique" ON "project_threed" USING btree ("project_id","threed_id");--> statement-breakpoint
CREATE INDEX "idx_project_traffic_project_id" ON "project_traffic" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_project_traffic_traffic_id" ON "project_traffic" USING btree ("traffic_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_project_traffic_unique" ON "project_traffic" USING btree ("project_id","traffic_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_settings_key" ON "settings" USING btree ("key");--> statement-breakpoint
CREATE INDEX "idx_settings_scope" ON "settings" USING btree ("scope");--> statement-breakpoint
CREATE INDEX "idx_settings_group" ON "settings" USING btree ("group");--> statement-breakpoint
CREATE INDEX "idx_settings_category" ON "settings" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_settings_enabled" ON "settings" USING btree ("is_enabled");--> statement-breakpoint
CREATE INDEX "idx_settings_audit_setting_id" ON "settings_audit_logs" USING btree ("setting_id");--> statement-breakpoint
CREATE INDEX "idx_settings_audit_user_id" ON "settings_audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_settings_audit_action" ON "settings_audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_settings_audit_created_at" ON "settings_audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_settings_deployment_name" ON "settings_deployment" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_settings_deployment_active" ON "settings_deployment" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_settings_deployment_environment" ON "settings_deployment" USING btree ("environment");--> statement-breakpoint
CREATE INDEX "idx_settings_deployment_rollback" ON "settings_deployment" USING btree ("rollback_to");--> statement-breakpoint
CREATE INDEX "idx_settings_deployment_history_deployment_id" ON "settings_deployment_history" USING btree ("deployment_id");--> statement-breakpoint
CREATE INDEX "idx_settings_deployment_history_action" ON "settings_deployment_history" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_settings_deployment_history_performed_at" ON "settings_deployment_history" USING btree ("performed_at");--> statement-breakpoint
CREATE INDEX "idx_settings_user_overrides_user_id" ON "settings_user_overrides" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_settings_user_overrides_setting_id" ON "settings_user_overrides" USING btree ("setting_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_settings_user_overrides_composite" ON "settings_user_overrides" USING btree ("user_id","setting_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_threed_slug" ON "threed" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_threed_user_id" ON "threed" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_threed_active" ON "threed" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_threed_project_id" ON "threed" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_threed_beds_bed_id" ON "threed_beds" USING btree ("bed_id");--> statement-breakpoint
CREATE INDEX "idx_threed_beds_active" ON "threed_beds" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_threed_beds_name" ON "threed_beds" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_threed_beds_marker" ON "threed_beds" USING btree ("marker_id");--> statement-breakpoint
CREATE INDEX "idx_threed_character_models_character_id" ON "threed_character_models" USING btree ("character_id");--> statement-breakpoint
CREATE INDEX "idx_threed_character_models_model_id" ON "threed_character_models" USING btree ("model_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_threed_character_models_unique" ON "threed_character_models" USING btree ("character_id","model_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_threed_characters_character_id" ON "threed_characters" USING btree ("character_id");--> statement-breakpoint
CREATE INDEX "idx_threed_characters_name" ON "threed_characters" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_threed_characters_type" ON "threed_characters" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_threed_characters_status" ON "threed_characters" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_threed_characters_movement_type" ON "threed_characters" USING btree ("movement_type");--> statement-breakpoint
CREATE INDEX "idx_threed_characters_model" ON "threed_characters" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "idx_threed_characters_bed" ON "threed_characters" USING btree ("bed_id");--> statement-breakpoint
CREATE INDEX "idx_threed_characters_visible" ON "threed_characters" USING btree ("visible");--> statement-breakpoint
CREATE INDEX "idx_threed_characters_marker" ON "threed_characters" USING btree ("marker_id");--> statement-breakpoint
CREATE INDEX "idx_threed_farmbot_logs_farmbot" ON "threed_farmbot_logs" USING btree ("farmbot_id");--> statement-breakpoint
CREATE INDEX "idx_threed_farmbot_logs_event_type" ON "threed_farmbot_logs" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_threed_farmbot_logs_logged_at" ON "threed_farmbot_logs" USING btree ("logged_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_threed_farmbots_device_id" ON "threed_farmbots" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "idx_threed_farmbots_status" ON "threed_farmbots" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_threed_farmbots_marker" ON "threed_farmbots" USING btree ("marker_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_threed_harvests_harvest_id" ON "threed_harvests" USING btree ("harvest_id");--> statement-breakpoint
CREATE INDEX "idx_threed_harvests_planting" ON "threed_harvests" USING btree ("planting_id");--> statement-breakpoint
CREATE INDEX "idx_threed_harvests_date" ON "threed_harvests" USING btree ("harvest_date");--> statement-breakpoint
CREATE INDEX "idx_threed_layer_presets_user_id" ON "threed_layer_presets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_threed_layers_user_id" ON "threed_layers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_threed_layers_type" ON "threed_layers" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_threed_layers_enabled" ON "threed_layers" USING btree ("is_enabled");--> statement-breakpoint
CREATE INDEX "idx_threed_marker_relationships_parent" ON "threed_marker_relationships" USING btree ("parent_marker_id");--> statement-breakpoint
CREATE INDEX "idx_threed_marker_relationships_child" ON "threed_marker_relationships" USING btree ("child_marker_id");--> statement-breakpoint
CREATE INDEX "idx_threed_markers_layer_id" ON "threed_markers" USING btree ("layer_id");--> statement-breakpoint
CREATE INDEX "idx_threed_markers_user_id" ON "threed_markers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_threed_markers_type" ON "threed_markers" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_threed_markers_source" ON "threed_markers" USING btree ("source_type","source_id");--> statement-breakpoint
CREATE INDEX "idx_threed_markers_status" ON "threed_markers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_threed_model_files_model_id" ON "threed_model_files" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "idx_threed_model_files_type" ON "threed_model_files" USING btree ("file_type");--> statement-breakpoint
CREATE INDEX "idx_threed_models_type" ON "threed_models" USING btree ("model_type");--> statement-breakpoint
CREATE INDEX "idx_threed_models_active" ON "threed_models" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_threed_models_marker" ON "threed_models" USING btree ("marker_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_threed_plantings_planting_id" ON "threed_plantings" USING btree ("planting_id");--> statement-breakpoint
CREATE INDEX "idx_threed_plantings_plant" ON "threed_plantings" USING btree ("plant_id");--> statement-breakpoint
CREATE INDEX "idx_threed_plantings_bed" ON "threed_plantings" USING btree ("bed_id");--> statement-breakpoint
CREATE INDEX "idx_threed_plantings_status" ON "threed_plantings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_threed_plantings_custom_model" ON "threed_plantings" USING btree ("custom_model_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_threed_plants_plant_id" ON "threed_plants" USING btree ("plant_id");--> statement-breakpoint
CREATE INDEX "idx_threed_plants_common_name" ON "threed_plants" USING btree ("common_name");--> statement-breakpoint
CREATE INDEX "idx_threed_plants_type" ON "threed_plants" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_threed_plants_status" ON "threed_plants" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_threed_plants_marker" ON "threed_plants" USING btree ("marker_id");--> statement-breakpoint
CREATE INDEX "idx_threed_system_logs_level" ON "threed_system_logs" USING btree ("level");--> statement-breakpoint
CREATE INDEX "idx_threed_system_logs_logged_at" ON "threed_system_logs" USING btree ("logged_at");--> statement-breakpoint
CREATE INDEX "idx_threed_tasks_user_id" ON "threed_tasks" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_threed_tasks_task_id" ON "threed_tasks" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_threed_tasks_due_date" ON "threed_tasks" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "idx_threed_tasks_priority" ON "threed_tasks" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_threed_tasks_status" ON "threed_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_threed_tasks_planting" ON "threed_tasks" USING btree ("planting_id");--> statement-breakpoint
CREATE INDEX "idx_threed_tasks_plant" ON "threed_tasks" USING btree ("plant_id");--> statement-breakpoint
CREATE INDEX "idx_threed_tasks_bed" ON "threed_tasks" USING btree ("bed_id");--> statement-breakpoint
CREATE INDEX "idx_threed_tasks_watering" ON "threed_tasks" USING btree ("watering_schedule_id");--> statement-breakpoint
CREATE INDEX "idx_threed_tasks_marker" ON "threed_tasks" USING btree ("marker_id");--> statement-breakpoint
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
CREATE INDEX "idx_threed_weather_recorded_at" ON "threed_weather_logs" USING btree ("recorded_at");--> statement-breakpoint
CREATE INDEX "idx_threed_weather_marker" ON "threed_weather_logs" USING btree ("marker_id");--> statement-breakpoint
CREATE INDEX "idx_traffic_user_id" ON "traffic" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_traffic_slug" ON "traffic" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_traffic_active" ON "traffic" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_api_logs_endpoint" ON "traffic_api_request_logs" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "idx_api_logs_logged_at" ON "traffic_api_request_logs" USING btree ("logged_at");--> statement-breakpoint
CREATE INDEX "idx_api_logs_success" ON "traffic_api_request_logs" USING btree ("is_success");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_511_event_id" ON "traffic_bay_area_511_events" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_511_event_type" ON "traffic_bay_area_511_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_511_county" ON "traffic_bay_area_511_events" USING btree ("county");--> statement-breakpoint
CREATE INDEX "idx_511_status" ON "traffic_bay_area_511_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_511_occurred_at" ON "traffic_bay_area_511_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "idx_511_active" ON "traffic_bay_area_511_events" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_calfire_incident_id" ON "traffic_calfire_incidents" USING btree ("incident_id");--> statement-breakpoint
CREATE INDEX "idx_calfire_status" ON "traffic_calfire_incidents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_calfire_county" ON "traffic_calfire_incidents" USING btree ("county");--> statement-breakpoint
CREATE INDEX "idx_calfire_started_at" ON "traffic_calfire_incidents" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "idx_calfire_active" ON "traffic_calfire_incidents" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_cctv_camera_id" ON "traffic_caltrans_cctv_cameras" USING btree ("camera_id");--> statement-breakpoint
CREATE INDEX "idx_cctv_county" ON "traffic_caltrans_cctv_cameras" USING btree ("county");--> statement-breakpoint
CREATE INDEX "idx_cctv_status" ON "traffic_caltrans_cctv_cameras" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_cctv_active" ON "traffic_caltrans_cctv_cameras" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_caltrans_district_id" ON "traffic_caltrans_districts" USING btree ("district_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_caltrans_district_number" ON "traffic_caltrans_districts" USING btree ("number");--> statement-breakpoint
CREATE INDEX "idx_caltrans_district_active" ON "traffic_caltrans_districts" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_caltrans_closure_id" ON "traffic_caltrans_lane_closures" USING btree ("closure_id");--> statement-breakpoint
CREATE INDEX "idx_caltrans_closure_district" ON "traffic_caltrans_lane_closures" USING btree ("district");--> statement-breakpoint
CREATE INDEX "idx_caltrans_closure_route" ON "traffic_caltrans_lane_closures" USING btree ("route");--> statement-breakpoint
CREATE INDEX "idx_caltrans_closure_county" ON "traffic_caltrans_lane_closures" USING btree ("county");--> statement-breakpoint
CREATE INDEX "idx_caltrans_closure_status" ON "traffic_caltrans_lane_closures" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_caltrans_closure_start_date" ON "traffic_caltrans_lane_closures" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "idx_caltrans_closure_active" ON "traffic_caltrans_lane_closures" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_caltrans_closure_composite" ON "traffic_caltrans_lane_closures" USING btree ("status","district","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_chp_center_id" ON "traffic_chp_cad_centers" USING btree ("center_id");--> statement-breakpoint
CREATE INDEX "idx_chp_center_county" ON "traffic_chp_cad_centers" USING btree ("county");--> statement-breakpoint
CREATE INDEX "idx_chp_center_active" ON "traffic_chp_cad_centers" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_chp_cad_incident_id" ON "traffic_chp_cad_incidents" USING btree ("incident_id");--> statement-breakpoint
CREATE INDEX "idx_chp_cad_status" ON "traffic_chp_cad_incidents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_chp_cad_location" ON "traffic_chp_cad_incidents" USING btree ("location");--> statement-breakpoint
CREATE INDEX "idx_chp_cad_county" ON "traffic_chp_cad_incidents" USING btree ("county");--> statement-breakpoint
CREATE INDEX "idx_chp_cad_reported_at" ON "traffic_chp_cad_incidents" USING btree ("reported_at");--> statement-breakpoint
CREATE INDEX "idx_chp_cad_active" ON "traffic_chp_cad_incidents" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_chp_cad_composite" ON "traffic_chp_cad_incidents" USING btree ("status","county","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_chp_cases_case_id" ON "traffic_chp_cases" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "idx_chp_cases_county" ON "traffic_chp_cases" USING btree ("county");--> statement-breakpoint
CREATE INDEX "idx_chp_cases_occurred_at" ON "traffic_chp_cases" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "idx_chp_cases_severity" ON "traffic_chp_cases" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_chp_cases_active" ON "traffic_chp_cases" USING btree ("is_active");