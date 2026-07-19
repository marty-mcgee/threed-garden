ALTER TABLE "project_music" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "project_threed" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "project_traffic" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "project_music" ADD CONSTRAINT "project_music_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_threed" ADD CONSTRAINT "project_threed_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_traffic" ADD CONSTRAINT "project_traffic_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;