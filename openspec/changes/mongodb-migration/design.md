## Context

The application currently uses PostgreSQL 16 (Docker-managed locally, Neon/Supabase in production) with Drizzle ORM. Fifteen normalized tables are defined in `src/db/schema/`, including several junction tables (`recipe_meals`, `recipe_courses`, `recipe_preparations`, `cookbook_recipes`, `recipe_likes`). All data access goes through tRPC routers (`src/server/trpc/routers/`) that import Drizzle query builders. Better-Auth handles authentication using a `drizzleAdapter`.

The current branch `feature/convert-to-mongodb` signals that this migration is a committed direction.

## Goals / Non-Goals

**Goals:**
- Replace PostgreSQL + Drizzle ORM with MongoDB + Mongoose ODM
- Simplify local development by removing the Docker PostgreSQL dependency
- Collapse junction tables into embedded arrays, reducing query complexity
- Maintain full type safety via Mongoose schemas with TypeScript
- Preserve all existing user-facing application behavior
- Allow tRPC procedure input/output shapes to change where MongoDB's document model makes a cleaner API natural (e.g., ID types, embedded vs. referenced fields) — since no production clients exist, shape changes that reduce friction are acceptable
- Update Better-Auth to use MongoDB natively

**Non-Goals:**
- Change UI or route structure
- Migrate existing production data (data migration is a separate concern — Milestone 09)
- Switch to a different ODM or schema strategy post-migration
- Rewrite test infrastructure beyond swapping the DB driver

## Decisions

### Decision 1: Mongoose ODM (over raw MongoDB driver)

**Chosen:** Mongoose
**Alternatives considered:** Native `mongodb` driver directly, Prisma with MongoDB connector

Mongoose provides schema definitions with validation, TypeScript-typed models, and lifecycle hooks — a natural successor to the Drizzle schema files. The project already relies on schema-first design (`src/db/schema/`); Mongoose perpetuates that pattern as `src/db/models/`. Raw driver would require hand-rolling all validation. Prisma's MongoDB support is experimental and lacks some relational features.

**Exception:** Better-Auth does not have a Mongoose adapter. It does have a `mongodbAdapter` that uses the native `MongoClient`. The auth connection will share the underlying `MongoClient` derived from the Mongoose connection:
```ts
// src/db/index.ts
mongoose.connection.getClient() // returns native MongoClient
```
This avoids maintaining two separate connections.

### Decision 2: Embed taxonomy arrays on recipes (no junction collections)

**Chosen:** Embedded ObjectId arrays on the `recipes` document
**Alternatives considered:** Separate junction collections (1:1 replica of current schema), full denormalization (embed meal/course/preparation name + id)

Junction collections are a relational pattern that makes little sense in MongoDB. Since meals, courses, and preparations are stable taxonomy values (seeded, rarely changed), storing their ObjectIds in arrays on the recipe is idiomatic. Queries become `Recipe.find({ mealIds: mealId })` instead of a two-table join. Full denormalization (embedding names too) would require updating all recipes when a taxonomy term name changes — an unnecessary coupling for now.

```ts
// Recipe document shape (relevant excerpt)
mealIds: [{ type: ObjectId, ref: 'Meal' }]
courseIds: [{ type: ObjectId, ref: 'Course' }]
preparationIds: [{ type: ObjectId, ref: 'Preparation' }]
```

### Decision 3: Embed cookbook recipe entries; keep recipe_likes as separate collection

**Chosen:** Cookbook recipes embedded; likes as a separate collection

`cookbook_recipes` (with `orderIndex`) is tightly coupled to its parent cookbook — no query ever asks "all cookbooks containing recipe X across all users" in a hot path. Embedding `{ recipeId, orderIndex }` objects in a `recipes` array on the Cookbook document is idiomatic.

`recipe_likes` is kept as a separate `RecipeLike` collection (`{ userId, recipeId, createdAt }`) because the app needs efficient queries in both directions: "did this user like this recipe?" and "all recipes liked by user X." A separate collection with compound indexes on `(userId, recipeId)` handles both with good performance.

### Decision 4: Separate reference collections for taxonomy terms, classifications, sources

**Chosen:** Keep meals, courses, preparations, classifications, and sources as separate Mongoose model collections

These are shared lookup tables used across many recipes. Embedding them into recipes would duplicate data and break the seeding/management workflow. They remain as separate collections with `_id` and `slug` fields.

### Decision 5: Connection singleton via Mongoose

**Chosen:** `mongoose.connect()` called once, exported as a ready-check utility
**Rationale:** Matches the current `Pool` singleton pattern in `src/db/index.ts`. Server functions and tRPC routers import models directly; Mongoose handles connection pooling internally.

### Decision 6: Test isolation via `mongodb-memory-server`

**Chosen:** `mongodb-memory-server` replaces Docker PostgreSQL for integration tests
**Rationale:** Spins up a real MongoDB process in-memory without network requirements. Tests remain isolated and parallelizable. The `beforeAll`/`afterAll` lifecycle mirrors the current `pg` pool setup.

### Decision 7: Local dev via Docker MongoDB; Atlas toggle via env var

**Chosen:** `docker-compose.yml` replaces the PostgreSQL service with a MongoDB service — Docker remains the single point of entry for local development. A developer who cannot run Docker (off-network, restricted machine, or wants centralized shared data) can set `MONGODB_URI` in `.env.local` to a MongoDB Atlas connection string; the app picks it up without code changes.

The convention:
- `.env.example` documents `MONGODB_URI=mongodb://localhost:27017/cookbook` as the Docker default
- If `MONGODB_URI` is overridden to an Atlas SRV string, `docker-compose` MongoDB is simply not used
- No additional env flag or toggle is needed — the URI itself is the toggle

This matches the existing Docker-first pattern (PostgreSQL was the same) while supporting Atlas for developers who want shared dev data or are working off-network.

### Decision 8: Mongoose strict mode globally enabled

**Chosen:** `mongoose.set('strict', true)` called at connection time in `src/db/index.ts`
**Rationale:** Global strict mode means Mongoose silently ignores fields not declared in a schema on write, preventing accidental data pollution. This aligns with the project's TypeScript strict posture — what isn't declared doesn't get stored.

## Risks / Trade-offs

- **No transactions by default** — MongoDB multi-document transactions require replica sets. The current app does not heavily rely on cross-table transactions (the `syncJunction` pattern is fire-and-forget), but any future transactional needs must use replica set config or be designed around single-document atomicity. Mitigation: document this limitation; MongoDB Atlas supports replica sets out of the box.

- **Better-Auth MongoDB adapter maturity** — Better-Auth's `mongodbAdapter` is less battle-tested than `drizzleAdapter`. Mitigation: pin Better-Auth version; run auth E2E tests before declaring migration complete.

- **ObjectId vs UUID** — All current IDs are UUIDs (string). MongoDB uses ObjectId by default. tRPC input schemas use `z.string().uuid()` validation for IDs. These validators must be relaxed to `z.string()` (ObjectId is a 24-char hex string, not UUID format). Mitigation: update all ID validators in tRPC routers as part of this migration.

- **`advanced.database.generateId: "uuid"` in Better-Auth** — This config option forces Better-Auth to generate UUID strings as IDs. Dropping it means Better-Auth will let MongoDB generate ObjectIds natively. Any stored session tokens or existing user IDs would be format-incompatible. Since this is a fresh migration (no production data yet), this is acceptable.

## Migration Plan

1. Install `mongoose`, `mongodb`, `mongodb-memory-server` (devDependency); remove `drizzle-orm`, `drizzle-kit`, `pg`, `@types/pg`
2. Create `src/db/models/` with one Mongoose model file per entity
3. Rewrite `src/db/index.ts` as a Mongoose connection singleton
4. Update `src/lib/auth.ts` to use `mongodbAdapter` from Better-Auth
5. Rewrite all tRPC routers to use Mongoose queries (removing Drizzle operators)
6. Rewrite `src/db/seeds/` for MongoDB
7. Remove `drizzle.config.ts` and `drizzle/` migration directory
8. Update `docker-compose.yml`: replace PostgreSQL service with MongoDB service (same port convention); Atlas URI override via `MONGODB_URI` in `.env.local` requires no code change
9. Update `.env.example`: replace `DATABASE_URL` with `MONGODB_URI`
10. Update Vitest config to use `mongodb-memory-server`
11. Update `CLAUDE.md` and `docs/database.md`

**Rollback:** The relational schema and Drizzle code remain in git history on the `main` branch. Reverting the migration is a branch operation with no data loss (no production data exists yet).

## Open Questions

_All questions resolved._
