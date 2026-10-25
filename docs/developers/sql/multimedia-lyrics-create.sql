-- Lyrics-only creation for a database where none of these four tables exist.
-- Does not rename earlier Lyrics tables or reconcile unrelated App schema drift.
-- Run manually as one transaction; if any table already exists, review instead of overwriting.
BEGIN;
SET LOCAL search_path = public;

CREATE TABLE "multimedia_lyrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "multimedia_lyrics_sort_range" CHECK ("multimedia_lyrics"."sort_order" BETWEEN -10000 AND 10000)
);

CREATE TABLE "multimedia_lyrics_albums" (
	"id" serial PRIMARY KEY NOT NULL,
	"lyrics_id" integer NOT NULL,
	"album_id" integer NOT NULL,
	CONSTRAINT "multimedia_lyrics_albums_pair" UNIQUE("lyrics_id","album_id")
);

CREATE TABLE "multimedia_lyrics_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"lyrics_id" integer NOT NULL,
	"project_id" integer NOT NULL,
	CONSTRAINT "multimedia_lyrics_projects_pair" UNIQUE("lyrics_id","project_id")
);

CREATE TABLE "multimedia_lyrics_tracks" (
	"id" serial PRIMARY KEY NOT NULL,
	"lyrics_id" integer NOT NULL,
	"track_id" integer NOT NULL,
	CONSTRAINT "multimedia_lyrics_tracks_pair" UNIQUE("lyrics_id","track_id")
);

ALTER TABLE "multimedia_lyrics" ADD CONSTRAINT "multimedia_lyrics_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "multimedia_lyrics_albums" ADD CONSTRAINT "multimedia_lyrics_albums_lyrics_id_multimedia_lyrics_id_fk" FOREIGN KEY ("lyrics_id") REFERENCES "public"."multimedia_lyrics"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "multimedia_lyrics_albums" ADD CONSTRAINT "multimedia_lyrics_albums_album_id_multimedia_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."multimedia_albums"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "multimedia_lyrics_projects" ADD CONSTRAINT "multimedia_lyrics_projects_lyrics_id_multimedia_lyrics_id_fk" FOREIGN KEY ("lyrics_id") REFERENCES "public"."multimedia_lyrics"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "multimedia_lyrics_projects" ADD CONSTRAINT "multimedia_lyrics_projects_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "multimedia_lyrics_tracks" ADD CONSTRAINT "multimedia_lyrics_tracks_lyrics_id_multimedia_lyrics_id_fk" FOREIGN KEY ("lyrics_id") REFERENCES "public"."multimedia_lyrics"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "multimedia_lyrics_tracks" ADD CONSTRAINT "multimedia_lyrics_tracks_track_id_multimedia_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."multimedia_tracks"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "multimedia_lyrics_owner_idx" ON "multimedia_lyrics" USING btree ("user_id");
CREATE INDEX "multimedia_lyrics_albums_parent_idx" ON "multimedia_lyrics_albums" USING btree ("album_id");
CREATE INDEX "multimedia_lyrics_projects_parent_idx" ON "multimedia_lyrics_projects" USING btree ("project_id");
CREATE INDEX "multimedia_lyrics_tracks_parent_idx" ON "multimedia_lyrics_tracks" USING btree ("track_id");

COMMIT;
