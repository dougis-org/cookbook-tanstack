-- PostgreSQL 16 migration file
-- This file uses PostgreSQL DDL syntax, not SQL Server T-SQL
-- Codacy: SQL Server-specific checks disabled for this file
-- (data compression and quoted identifiers are not applicable to PostgreSQL)

CREATE EXTENSION IF NOT EXISTS pgcrypto;
--> statement-breakpoint
CREATE TABLE "classifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"slug" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "classifications_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "cookbook_followers" (
	"user_id" uuid NOT NULL,
	"cookbook_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cookbook_followers_user_id_cookbook_id_pk" PRIMARY KEY("user_id","cookbook_id")
);
--> statement-breakpoint
CREATE TABLE "cookbook_recipes" (
	"cookbook_id" uuid NOT NULL,
	"recipe_id" uuid NOT NULL,
	"order_index" integer,
	CONSTRAINT "cookbook_recipes_cookbook_id_recipe_id_pk" PRIMARY KEY("cookbook_id","recipe_id")
);
--> statement-breakpoint
CREATE TABLE "cookbooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_public" boolean DEFAULT true NOT NULL,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"slug" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "courses_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "meals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"slug" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "meals_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "preparations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"slug" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "preparations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "recipe_courses" (
	"recipe_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	CONSTRAINT "recipe_courses_recipe_id_course_id_pk" PRIMARY KEY("recipe_id","course_id")
);
--> statement-breakpoint
CREATE TABLE "recipe_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"url" text NOT NULL,
	"alt_text" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_likes" (
	"user_id" uuid NOT NULL,
	"recipe_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "recipe_likes_user_id_recipe_id_pk" PRIMARY KEY("user_id","recipe_id")
);
--> statement-breakpoint
CREATE TABLE "recipe_meals" (
	"recipe_id" uuid NOT NULL,
	"meal_id" uuid NOT NULL,
	CONSTRAINT "recipe_meals_recipe_id_meal_id_pk" PRIMARY KEY("recipe_id","meal_id")
);
--> statement-breakpoint
CREATE TABLE "recipe_preparations" (
	"recipe_id" uuid NOT NULL,
	"preparation_id" uuid NOT NULL,
	CONSTRAINT "recipe_preparations_recipe_id_preparation_id_pk" PRIMARY KEY("recipe_id","preparation_id")
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(500) NOT NULL,
	"ingredients" text,
	"instructions" text,
	"notes" text,
	"servings" integer,
	"source_id" uuid,
	"classification_id" uuid,
	"date_added" timestamp DEFAULT now() NOT NULL,
	"calories" integer,
	"fat" real,
	"cholesterol" real,
	"sodium" real,
	"protein" real,
	"marked" boolean DEFAULT false NOT NULL,
	"image_url" text,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"username" varchar(100) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(255),
	"avatar_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "cookbook_followers" ADD CONSTRAINT "cookbook_followers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cookbook_followers" ADD CONSTRAINT "cookbook_followers_cookbook_id_cookbooks_id_fk" FOREIGN KEY ("cookbook_id") REFERENCES "public"."cookbooks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cookbook_recipes" ADD CONSTRAINT "cookbook_recipes_cookbook_id_cookbooks_id_fk" FOREIGN KEY ("cookbook_id") REFERENCES "public"."cookbooks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cookbook_recipes" ADD CONSTRAINT "cookbook_recipes_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cookbooks" ADD CONSTRAINT "cookbooks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_courses" ADD CONSTRAINT "recipe_courses_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_courses" ADD CONSTRAINT "recipe_courses_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_images" ADD CONSTRAINT "recipe_images_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_likes" ADD CONSTRAINT "recipe_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_likes" ADD CONSTRAINT "recipe_likes_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_meals" ADD CONSTRAINT "recipe_meals_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_meals" ADD CONSTRAINT "recipe_meals_meal_id_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_preparations" ADD CONSTRAINT "recipe_preparations_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_preparations" ADD CONSTRAINT "recipe_preparations_preparation_id_preparations_id_fk" FOREIGN KEY ("preparation_id") REFERENCES "public"."preparations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_classification_id_classifications_id_fk" FOREIGN KEY ("classification_id") REFERENCES "public"."classifications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cookbook_followers_user_id_idx" ON "cookbook_followers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cookbook_followers_cookbook_id_idx" ON "cookbook_followers" USING btree ("cookbook_id");--> statement-breakpoint
CREATE INDEX "cookbook_recipes_cookbook_id_idx" ON "cookbook_recipes" USING btree ("cookbook_id");--> statement-breakpoint
CREATE INDEX "cookbook_recipes_recipe_id_idx" ON "cookbook_recipes" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "cookbooks_user_id_idx" ON "cookbooks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "recipe_courses_recipe_id_idx" ON "recipe_courses" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "recipe_courses_course_id_idx" ON "recipe_courses" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "recipe_images_recipe_id_idx" ON "recipe_images" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "recipe_likes_user_id_idx" ON "recipe_likes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "recipe_likes_recipe_id_idx" ON "recipe_likes" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "recipe_meals_recipe_id_idx" ON "recipe_meals" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "recipe_meals_meal_id_idx" ON "recipe_meals" USING btree ("meal_id");--> statement-breakpoint
CREATE INDEX "recipe_preparations_recipe_id_idx" ON "recipe_preparations" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "recipe_preparations_preparation_id_idx" ON "recipe_preparations" USING btree ("preparation_id");--> statement-breakpoint
CREATE INDEX "recipes_user_id_idx" ON "recipes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "recipes_source_id_idx" ON "recipes" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "recipes_classification_id_idx" ON "recipes" USING btree ("classification_id");--> statement-breakpoint
CREATE INDEX "recipes_name_idx" ON "recipes" USING btree ("name");