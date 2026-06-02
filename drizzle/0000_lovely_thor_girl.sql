CREATE TYPE "public"."album_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."music_link_status" AS ENUM('active', 'inactive', 'pending', 'expired');--> statement-breakpoint
CREATE TYPE "public"."music_link_type" AS ENUM('external', 'social', 'buy', 'stream', 'video');--> statement-breakpoint
CREATE TYPE "public"."music_polling_type" AS ENUM('metadata', 'stats', 'sync');--> statement-breakpoint
CREATE TYPE "public"."track_status" AS ENUM('active', 'inactive', 'processing');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "music_album_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"album_id" integer,
	"link_id" integer,
	"link_type" text NOT NULL,
	"track_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now() NOT NULL
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
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "music_polling_logs" (
	"id" serial PRIMARY KEY NOT NULL,
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
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_album_links" ADD CONSTRAINT "music_album_links_album_id_music_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."music_albums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_album_links" ADD CONSTRAINT "music_album_links_link_id_music_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."music_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_album_links" ADD CONSTRAINT "music_album_links_track_id_music_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."music_tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_albums" ADD CONSTRAINT "music_albums_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_links" ADD CONSTRAINT "music_links_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_tracks" ADD CONSTRAINT "music_tracks_album_id_music_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."music_albums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "album_links_album_link_idx" ON "music_album_links" USING btree ("album_id","link_id");--> statement-breakpoint
CREATE UNIQUE INDEX "album_links_track_link_idx" ON "music_album_links" USING btree ("track_id","link_id");--> statement-breakpoint
CREATE UNIQUE INDEX "music_albums_user_id_idx" ON "music_albums" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "music_albums_status_idx" ON "music_albums" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "music_links_user_id_idx" ON "music_links" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "music_links_type_idx" ON "music_links" USING btree ("type");--> statement-breakpoint
CREATE INDEX "music_polling_logs_type_idx" ON "music_polling_logs" USING btree ("poll_type");--> statement-breakpoint
CREATE INDEX "music_polling_logs_status_idx" ON "music_polling_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "music_polling_logs_type_status_idx" ON "music_polling_logs" USING btree ("poll_type","status");--> statement-breakpoint
CREATE UNIQUE INDEX "music_tracks_album_id_idx" ON "music_tracks" USING btree ("album_id");--> statement-breakpoint
CREATE UNIQUE INDEX "music_tracks_status_idx" ON "music_tracks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");