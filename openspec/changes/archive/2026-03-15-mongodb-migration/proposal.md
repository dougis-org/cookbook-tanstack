## Why

The current database layer uses PostgreSQL with Drizzle ORM, requiring Docker to run locally and a managed PostgreSQL service in production. Migrating to MongoDB simplifies the infrastructure (Atlas free tier is generous, no Docker needed for local dev), and the document model aligns well with how recipes are read and written — a single recipe with its embedded classification, sources, meals, courses, and preparations is a natural document unit rather than a join-heavy relational query.

## What Changes

- Replace PostgreSQL + Drizzle ORM with MongoDB + Mongoose ODM
- Replace `docker-compose` PostgreSQL service with MongoDB Atlas (production) and local `mongod` or Atlas local dev (development)
- Replace `src/db/schema/*.ts` (Drizzle table definitions) with `src/db/models/*.ts` (Mongoose schemas/models)
- Replace `src/db/index.ts` (Drizzle + pg Pool) with a Mongoose connection singleton
- Collapse junction tables (`recipe_meals`, `recipe_courses`, `recipe_preparations`, `cookbook_recipes`, `recipe_likes`) into embedded arrays within parent documents
- Replace `src/db/seeds/*.ts` with MongoDB-compatible seed scripts
- Replace all data-access calls throughout route loaders and server functions (currently using Drizzle's query builder) with Mongoose queries
- Update `drizzle.config.ts` → remove; update `.env.example` with `MONGODB_URI`
- Update `CLAUDE.md` and `docs/database.md` to reflect new stack
- **BREAKING**: `DATABASE_URL` env var replaced by `MONGODB_URI`
- **BREAKING**: All UUID primary keys replaced by MongoDB ObjectId (`_id`)

## Capabilities

### New Capabilities

- `mongodb-data-layer`: MongoDB connection, Mongoose models, and seed scripts replacing the PostgreSQL/Drizzle data layer — covers schema design, connection management, and data seeding

### Modified Capabilities

<!-- No existing specs to modify -->

## Impact

- **Removed dependencies:** `drizzle-orm`, `drizzle-kit`, `pg`, `@types/pg`, `postgres`
- **Added dependencies:** `mongoose`, `mongodb`
- **Affected files:** All files under `src/db/`, all route loaders/server functions that query the database, `drizzle.config.ts`, `docker-compose.yml`, `.env.example`, `CLAUDE.md`, `docs/database.md`
- **Infrastructure:** Docker `docker-compose.yml` PostgreSQL service removed; developers use a local MongoDB instance or MongoDB Atlas free tier
- **Testing:** Vitest integration tests targeting the DB layer need to switch to `mongodb-memory-server` for in-process test isolation
