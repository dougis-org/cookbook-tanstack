-- Add displayUsername field for Better Auth username plugin
ALTER TABLE "users" ADD COLUMN "display_username" varchar(100);
