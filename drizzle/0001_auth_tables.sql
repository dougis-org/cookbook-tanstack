-- Auth system tables for Better-Auth integration
-- Applied as part of Milestone 01: Authentication System

-- Adapt users table for Better-Auth compatibility
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified" boolean NOT NULL DEFAULT false;
ALTER TABLE "users" DROP COLUMN IF EXISTS "password_hash";

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='avatar_url') THEN
    ALTER TABLE "users" RENAME COLUMN "avatar_url" TO "image";
  END IF;
END $$;

-- Session table (managed by Better-Auth)
CREATE TABLE IF NOT EXISTS "sessions" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "expires_at" timestamp NOT NULL,
  "token" text NOT NULL UNIQUE,
  "ip_address" text,
  "user_agent" text,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Account table (managed by Better-Auth — stores provider credentials)
CREATE TABLE IF NOT EXISTS "accounts" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "account_id" text NOT NULL,
  "provider_id" text NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "access_token" text,
  "refresh_token" text,
  "id_token" text,
  "access_token_expires_at" timestamp,
  "refresh_token_expires_at" timestamp,
  "scope" text,
  "password" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Verification table (managed by Better-Auth — email verification, password reset tokens)
CREATE TABLE IF NOT EXISTS "verifications" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
