ALTER TABLE "music_albums" ADD COLUMN "sort_order" integer DEFAULT 0;--> statement-breakpoint
CREATE INDEX "music_albums_sort_order_idx" ON "music_albums" USING btree ("sort_order");