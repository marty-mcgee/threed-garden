ALTER TABLE "music_album_links" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "music_album_links" CASCADE;--> statement-breakpoint
ALTER TABLE "music_links" ADD COLUMN "album_id" integer;--> statement-breakpoint
ALTER TABLE "music_links" ADD COLUMN "track_id" integer;--> statement-breakpoint
ALTER TABLE "music_links" ADD CONSTRAINT "music_links_album_id_music_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."music_albums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_links" ADD CONSTRAINT "music_links_track_id_music_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."music_tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "music_links_album_id_idx" ON "music_links" USING btree ("album_id");--> statement-breakpoint
CREATE INDEX "music_links_track_id_idx" ON "music_links" USING btree ("track_id");--> statement-breakpoint
CREATE INDEX "music_links_status_idx" ON "music_links" USING btree ("status");