-- Add prep_time, cook_time, and difficulty columns to recipes
-- These fields exist in the Drizzle schema but were missing from the initial migration.
ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "prep_time" integer;
--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "cook_time" integer;
--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "difficulty" varchar(20);
