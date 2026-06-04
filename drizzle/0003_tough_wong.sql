CREATE TABLE "music_media" (
	"id" serial PRIMARY KEY NOT NULL,
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
ALTER TABLE "music_media" ADD CONSTRAINT "music_media_album_id_music_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."music_albums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "music_media_album_id_idx" ON "music_media" USING btree ("album_id");--> statement-breakpoint
CREATE INDEX "music_media_is_primary_idx" ON "music_media" USING btree ("is_primary");