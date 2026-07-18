ALTER TABLE "threed_beds" DROP CONSTRAINT "threed_beds_threed_id_threed_id_fk";
--> statement-breakpoint
ALTER TABLE "threed_characters" DROP CONSTRAINT "threed_characters_threed_id_threed_id_fk";
--> statement-breakpoint
ALTER TABLE "threed_farmbots" DROP CONSTRAINT "threed_farmbots_threed_id_threed_id_fk";
--> statement-breakpoint
ALTER TABLE "threed_harvests" DROP CONSTRAINT "threed_harvests_threed_id_threed_id_fk";
--> statement-breakpoint
ALTER TABLE "threed_models" DROP CONSTRAINT "threed_models_threed_id_threed_id_fk";
--> statement-breakpoint
ALTER TABLE "threed_plantings" DROP CONSTRAINT "threed_plantings_threed_id_threed_id_fk";
--> statement-breakpoint
ALTER TABLE "threed_plants" DROP CONSTRAINT "threed_plants_threed_id_threed_id_fk";
--> statement-breakpoint
ALTER TABLE "threed_tasks" DROP CONSTRAINT "threed_tasks_threed_id_threed_id_fk";
--> statement-breakpoint
DROP INDEX "idx_threed_beds_threed_id";--> statement-breakpoint
DROP INDEX "idx_threed_characters_threed_id";--> statement-breakpoint
DROP INDEX "idx_threed_farmbots_threed_id";--> statement-breakpoint
DROP INDEX "idx_threed_harvests_threed_id";--> statement-breakpoint
DROP INDEX "idx_threed_models_threed_id";--> statement-breakpoint
DROP INDEX "idx_threed_plantings_threed_id";--> statement-breakpoint
DROP INDEX "idx_threed_plants_threed_id";--> statement-breakpoint
DROP INDEX "idx_threed_tasks_threed_id";--> statement-breakpoint
ALTER TABLE "threed_beds" DROP COLUMN "threed_id";--> statement-breakpoint
ALTER TABLE "threed_characters" DROP COLUMN "threed_id";--> statement-breakpoint
ALTER TABLE "threed_farmbots" DROP COLUMN "threed_id";--> statement-breakpoint
ALTER TABLE "threed_harvests" DROP COLUMN "threed_id";--> statement-breakpoint
ALTER TABLE "threed_models" DROP COLUMN "threed_id";--> statement-breakpoint
ALTER TABLE "threed_plantings" DROP COLUMN "threed_id";--> statement-breakpoint
ALTER TABLE "threed_plants" DROP COLUMN "threed_id";--> statement-breakpoint
ALTER TABLE "threed_tasks" DROP COLUMN "threed_id";