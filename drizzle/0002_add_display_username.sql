-- Add displayUsername field for Better Auth username plugin
ALTER TABLE "users" ADD COLUMN "display_username" varchar(100);
-- Populate displayUsername with username for existing rows
UPDATE "users" SET "display_username" = "username" WHERE "display_username" IS NULL;
-- Make the column NOT NULL
ALTER TABLE "users" ALTER COLUMN "display_username" SET NOT NULL;
