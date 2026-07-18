ALTER TABLE "threed_beds" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "threed_characters" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "threed_farmbot_logs" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "threed_farmbots" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "threed_harvests" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "threed_model_files" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "threed_models" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "threed_plantings" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "threed_plants" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "threed_system_logs" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "threed_tasks" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "threed_watering_history" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "threed_watering_schedules" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "threed_weather_logs" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "threed_beds" ADD CONSTRAINT "threed_beds_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_characters" ADD CONSTRAINT "threed_characters_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_farmbot_logs" ADD CONSTRAINT "threed_farmbot_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_farmbots" ADD CONSTRAINT "threed_farmbots_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_harvests" ADD CONSTRAINT "threed_harvests_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_model_files" ADD CONSTRAINT "threed_model_files_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_models" ADD CONSTRAINT "threed_models_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_plantings" ADD CONSTRAINT "threed_plantings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_plants" ADD CONSTRAINT "threed_plants_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_system_logs" ADD CONSTRAINT "threed_system_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_tasks" ADD CONSTRAINT "threed_tasks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_watering_history" ADD CONSTRAINT "threed_watering_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_watering_schedules" ADD CONSTRAINT "threed_watering_schedules_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threed_weather_logs" ADD CONSTRAINT "threed_weather_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;