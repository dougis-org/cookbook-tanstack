## 1. Dependencies & Configuration

- [x] 1.1 Remove `drizzle-orm`, `drizzle-kit`, `pg`, `@types/pg` from `package.json`
- [x] 1.2 Add `mongoose`, `mongodb` to `package.json` dependencies
- [x] 1.3 Add `mongodb-memory-server` to `package.json` devDependencies
- [x] 1.4 Replace `DATABASE_URL` with `MONGODB_URI` in `.env.example`; set default to `mongodb://localhost:27017/cookbook` (Docker); add comment documenting how to override with an Atlas SRV string for off-network / shared-data dev
- [x] 1.5 Delete `drizzle.config.ts` and the `drizzle/` migrations directory
- [x] 1.6 Update `docker-compose.yml`: replace the PostgreSQL service with a MongoDB service (e.g., `mongo:7`, expose port 27017, named volume for data persistence)
- [x] 1.7 Update `npm run db:push` and `npm run db:migrate` scripts in `package.json` (remove or replace with a `db:connect` health-check)

## 2. MongoDB Connection

- [x] 2.1 Rewrite `src/db/index.ts` as a Mongoose connection singleton: reads `MONGODB_URI` (throws if missing), calls `mongoose.set('strict', true)` globally, calls `mongoose.connect()`, and exports the `mongoose` instance
- [x] 2.2 Export a `getMongoClient()` helper that returns `mongoose.connection.getClient()` for use by Better-Auth

## 3. Mongoose Models

- [x] 3.1 Create `src/db/models/columns.ts` with shared schema helpers: `timestamps` plugin (createdAt/updatedAt) and ObjectId type alias
- [x] 3.2 Create `src/db/models/user.ts` — User model (mirrors `users` table: email, emailVerified, username, displayUsername, name, image)
- [x] 3.3 Create `src/db/models/session.ts` — Session model (expiresAt, token, ipAddress, userAgent, userId ref)
- [x] 3.4 Create `src/db/models/account.ts` — Account model (accountId, providerId, userId ref, tokens, scope, password)
- [x] 3.5 Create `src/db/models/verification.ts` — Verification model (identifier, value, expiresAt)
- [x] 3.6 Create `src/db/models/classification.ts` — Classification model (name, description, slug unique)
- [x] 3.7 Create `src/db/models/source.ts` — Source model (name, url)
- [x] 3.8 Create `src/db/models/meal.ts` — Meal model (name, description, slug unique)
- [x] 3.9 Create `src/db/models/course.ts` — Course model (name, description, slug unique)
- [x] 3.10 Create `src/db/models/preparation.ts` — Preparation model (name, description, slug unique)
- [x] 3.11 Create `src/db/models/recipe.ts` — Recipe model with all fields from current schema plus embedded `mealIds`, `courseIds`, `preparationIds` ObjectId arrays (replacing junction tables)
- [x] 3.12 Create `src/db/models/cookbook.ts` — Cookbook model with embedded `recipes: [{ recipeId, orderIndex }]` array (replacing `cookbook_recipes` junction)
- [x] 3.13 Create `src/db/models/recipe-like.ts` — RecipeLike model (userId ref, recipeId ref, createdAt) with compound index on `(userId, recipeId)`
- [x] 3.14 Create `src/db/models/index.ts` barrel-exporting all models

## 4. Better-Auth MongoDB Adapter

- [x] 4.1 Rewrite `src/lib/auth.ts` to import `mongodbAdapter` from `better-auth/adapters/mongodb` and pass `getMongoClient()` plus database name
- [x] 4.2 Remove `advanced.database.generateId: "uuid"` from Better-Auth config
- [x] 4.3 Remove `schema` mapping (drizzle-specific) from Better-Auth config

## 5. tRPC Router Updates

- [x] 5.1 Update `src/server/trpc/routers/_helpers.ts` — remove `syncJunction` (no longer needed), update `visibilityFilter` and `verifyOwnership` to use Mongoose syntax
- [x] 5.2 Rewrite `src/server/trpc/routers/recipes.ts` — replace all Drizzle imports and queries with Mongoose; replace `syncJunction` calls with `$set` on taxonomy arrays; change ID validators from `z.string().uuid()` to `z.string()`
- [x] 5.3 Rewrite `src/server/trpc/routers/cookbooks.ts` — use Cookbook Mongoose model; replace junction queries with embedded array operations; change ID validators
- [x] 5.4 Rewrite `src/server/trpc/routers/meals.ts` — use Meal Mongoose model; change ID validators
- [x] 5.5 Rewrite `src/server/trpc/routers/courses.ts` — use Course Mongoose model; change ID validators
- [x] 5.6 Rewrite `src/server/trpc/routers/preparations.ts` — use Preparation Mongoose model; change ID validators
- [x] 5.7 Rewrite `src/server/trpc/routers/classifications.ts` — use Classification Mongoose model; change ID validators
- [x] 5.8 Rewrite `src/server/trpc/routers/sources.ts` — use Source Mongoose model; change ID validators
- [x] 5.9 Rewrite `src/server/trpc/routers/users.ts` — use User Mongoose model; change ID validators

## 6. Seeds

- [x] 6.1 Rewrite `src/db/seeds/meals.ts` to use Meal model with `updateOne({ slug }, data, { upsert: true })`
- [x] 6.2 Rewrite `src/db/seeds/courses.ts` to use Course model with upsert
- [x] 6.3 Rewrite `src/db/seeds/preparations.ts` to use Preparation model with upsert
- [x] 6.4 Rewrite `src/db/seeds/index.ts` to connect to MongoDB before seeding and disconnect after
- [x] 6.5 Verify `npm run db:seed` runs successfully against a local MongoDB instance

## 7. Test Infrastructure

- [x] 7.1 Create `src/test/setup-mongodb.ts` — global Vitest setup that starts `mongodb-memory-server`, connects Mongoose, and disconnects/stops after all tests
- [x] 7.2 Update `vitest.config.ts` to reference the new global setup file
- [x] 7.3 Update any existing Vitest integration tests that use the DB to work with Mongoose models instead of Drizzle

## 8. Documentation & Cleanup

- [x] 8.1 Update `CLAUDE.md` database section: replace PostgreSQL/Drizzle references with MongoDB/Mongoose, update env var name, update commands table
- [x] 8.2 Update `docs/database.md` to document MongoDB collection structure and document shapes
- [x] 8.3 Delete all files in `src/db/schema/` (old Drizzle schemas deleted; seeds already rewritten in place)
- [x] 8.4 Run `npm run build` and fix any TypeScript errors from removed Drizzle types
- [x] 8.5 Run `npm run test` and verify all tests pass with `mongodb-memory-server`
- [x] 8.6 Run `npm run test:e2e` and verify auth and recipe flows work end-to-end
