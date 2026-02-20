-- Add prep_time, cook_time, and difficulty to recipes.
-- These columns were defined in src/db/schema/recipes.ts but omitted from
-- 0000_nice_giant_man.sql (the initial migration), causing a schema drift that
-- surfaced as "column does not exist" errors in integration tests.
ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "prep_time" integer;
--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "cook_time" integer;
--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "difficulty" varchar(20);
