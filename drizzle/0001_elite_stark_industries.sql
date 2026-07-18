ALTER TABLE "music_album_links" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "music_polling_logs" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "music_tracks" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "music_album_links" ADD CONSTRAINT "music_album_links_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_polling_logs" ADD CONSTRAINT "music_polling_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_tracks" ADD CONSTRAINT "music_tracks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;