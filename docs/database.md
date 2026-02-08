# Database Schema

CookBook uses PostgreSQL 16 with Drizzle ORM for type-safe database access.

## Quick Start

```bash
docker compose up -d          # Start PostgreSQL
npm run db:push               # Apply schema to database
npm run db:seed               # Seed taxonomy data
npm run db:studio             # Browse data in Drizzle Studio
```

## Schema Overview

The database has 15 tables organized into four groups:

### Core Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts with email/password auth |
| `recipes` | Recipe content, nutrition data, and metadata |
| `classifications` | Recipe classifications (e.g., cuisine type) |
| `sources` | Recipe sources (books, websites, etc.) |
| `cookbooks` | User-curated recipe collections |

### Taxonomy Tables

| Table | Purpose |
|-------|---------|
| `meals` | Meal types (Breakfast, Lunch, Dinner, etc.) |
| `courses` | Course types (Appetizer, Main Course, Dessert, etc.) |
| `preparations` | Preparation methods (Baked, Grilled, Steamed, etc.) |

All taxonomy tables share the same structure: `id`, `name`, `description`, `slug` (unique), and timestamps. Slugs enable URL-friendly lookups.

### Junction Tables

| Table | Relationship |
|-------|-------------|
| `recipe_meals` | Recipe ↔ Meal (many-to-many) |
| `recipe_courses` | Recipe ↔ Course (many-to-many) |
| `recipe_preparations` | Recipe ↔ Preparation (many-to-many) |
| `cookbook_recipes` | Cookbook ↔ Recipe (many-to-many, with ordering) |

Junction tables use composite primary keys (no surrogate ID). All foreign keys cascade on delete.

### Additional Tables

| Table | Purpose |
|-------|---------|
| `recipe_images` | Multiple images per recipe with ordering |
| `recipe_likes` | User ↔ Recipe likes (composite PK) |
| `cookbook_followers` | User ↔ Cookbook follows (composite PK) |

## Key Relationships

- **User → Recipes**: One-to-many (CASCADE delete)
- **User → Cookbooks**: One-to-many (CASCADE delete)
- **Recipe → Source**: Many-to-one (SET NULL on delete)
- **Recipe → Classification**: Many-to-one (SET NULL on delete)
- **Recipe ↔ Meals/Courses/Preparations**: Many-to-many via junction tables

## Indexing Strategy

- **Primary keys**: All tables have UUID primary keys with `gen_random_uuid()`
- **Unique constraints**: `users.email`, `users.username`, plus `slug` on all taxonomy tables
- **Foreign key indexes**: Every FK column is explicitly indexed for JOIN performance
- **Search indexes**: `recipes.name` is indexed for name-based searches

## Column Conventions

- **Snake case**: All DB column names use `snake_case` (e.g., `user_id`, `created_at`)
- **Camel case**: TypeScript field names use `camelCase` (Drizzle maps between them)
- **Timestamps**: All tables include `created_at` and `updated_at` (default `now()`)
- **UUIDs**: All primary keys use UUID v4 generated at the database level
- **Booleans**: Default to explicit values (`false` for `marked`, `true` for `is_public`)

## Schema Files

All schema definitions live in `src/db/schema/`:

```
src/db/schema/
├── index.ts              # Barrel re-export
├── users.ts
├── recipes.ts
├── classifications.ts
├── sources.ts
├── cookbooks.ts
├── meals.ts
├── courses.ts
├── preparations.ts
├── recipe_meals.ts
├── recipe_courses.ts
├── recipe_preparations.ts
├── cookbook_recipes.ts
├── recipe_images.ts
├── recipe_likes.ts
└── cookbook_followers.ts
```

## Migrations

Generated migrations live in `drizzle/` and should be committed to version control. The `drizzle/meta/` directory contains Drizzle's internal snapshot state.

```bash
npm run db:generate    # Generate migration SQL from schema changes
npm run db:migrate     # Apply pending migrations
npm run db:push        # Push schema directly (dev only, no migration file)
```
