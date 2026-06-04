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
ALTER TABLE "music_playback_history" ADD CONSTRAINT "music_playback_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_playback_history" ADD CONSTRAINT "music_playback_history_track_id_music_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."music_tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_playback_history" ADD CONSTRAINT "music_playback_history_album_id_music_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."music_albums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "music_playback_user_id_idx" ON "music_playback_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "music_playback_track_id_idx" ON "music_playback_history" USING btree ("track_id");--> statement-breakpoint
CREATE INDEX "music_playback_played_at_idx" ON "music_playback_history" USING btree ("played_at");