ALTER TABLE "traffic" ADD COLUMN "settings" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "traffic" ADD COLUMN "refresh_interval" integer DEFAULT 60;