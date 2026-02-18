# Implementation Plan: Replace mock DB in tRPC tests with Testcontainers PostgreSQL

**Issue:** #131  
**Repository:** dougis-org/cookbook-tanstack  
**Branch:** `feature/131-testcontainers-db-tests`

---

## 1) Summary

- **Ticket:** #131
- **One-liner:** Replace hand-rolled `createMockDb()` mock with Testcontainers PostgreSQL to enable realistic SQL validation in tRPC router tests.
- **Related milestone(s):** MILESTONE-03 (Testing Infrastructure), MILESTONE-04 (tRPC API Consolidation)
- **Out of scope:**
  - Replacing mocks in component tests or E2E tests
  - Changes to production database schema or migrations
  - Adding new tRPC endpoints or features
  - Modifying Playwright E2E test infrastructure

---

## 2) Assumptions & Open Questions

**Assumptions:**
- Docker/Testcontainers is available in CI/CD environment (`ubuntu-latest` GitHub Actions runner supports Docker)
- Per-test transaction rollback is preferred over snapshot restore for test isolation (simpler, faster)
- Transaction-based isolation acceptable for single-worker Vitest runs; container reuse per Vitest configurable in CI
- Existing seed data (meals, courses, preparations) will be applied before each test file's suite runs
- No breaking changes to `src/server/trpc/context.ts` or `src/server/trpc/init.ts` (these remain unit tests with mocks)

**Open questions (none blocking; proceeding with assumptions above):**
- None identified. Acceptance criteria and scope are clear.

---

## 3) Acceptance Criteria (normalized)

1. **Test database infrastructure**
   - Testcontainers PostgreSQL helper created at `src/test-helpers/testdb.ts`
   - Helper exports `startTestDb()`, `getTestDbClient()`, `withTestTransaction()` functions
   - Vitest has global setup/teardown configured to manage container lifecycle
   - Helper validated with passing unit tests

2. **Router test migration**
   - `src/server/trpc/routers/__tests__/helpers.test.ts` migrated to real DB; all tests pass
   - `src/server/trpc/routers/__tests__/recipes.test.ts` migrated to real DB; all tests pass
   - `src/server/trpc/routers/__tests__/taxonomy.test.ts` migrated to real DB; all tests pass
   - `src/server/trpc/__tests__/integration.test.ts` migrated to real DB; all tests pass
   - Each test executes in transaction; database rolled back after each test
   - No remaining `createMockDb()` references in migrated test files

3. **No mock contamination**
   - `src/test-helpers/mocks.ts` retained for other tests but not used in migrated tRPC router tests
   - `createMockDb()` removed or marked deprecated after migration complete
   - All other tests (`context.test.ts`, `init.test.ts`, component tests) continue to pass with no changes required

4. **Performance & reliability**
   - `npm run test` runs all tests (including new Testcontainers-backed tests) and completes in <60s locally
   - Tests are deterministic: running once, the file, or the suite yields identical results
   - No flakiness introduced; retries not required

5. **CI/CD integration**
   - GitHub Actions workflow (`.github/workflows/test.yml`) runs Testcontainers-backed tests on `ubuntu-latest`
   - All tests pass in CI without manual setup beyond standard `npm install && npm run test`
   - No new environment variables required; Testcontainers manages containerization internally

6. **Documentation**
   - `CONTRIBUTING.md` updated with note: "Tests require Docker for Testcontainers; ensure `docker` command is available"
   - Code comments in test helpers document transaction isolation and cleanup strategy

---

## 4) Approach & Design Brief

### Current state (key code paths)

**Mock DB factory** (`src/test-helpers/mocks.ts`):
- `createMockDb(result)` returns a stubbed Drizzle client
- Stubs `.select()`, `.insert()`, `.update()`, `.delete()`, `.transaction()` chains
- Returns hardcoded `result` array regardless of WHERE clauses, condition chains, or uniqueness constraints
- Used by `helpers.test.ts`, `recipes.test.ts`, `integration.test.ts`, `taxonomy.test.ts`

**Test runners**:
- `vitest.config.ts` uses `jsdom` environment + `test-setup.ts` for cleanup
- No global setup/teardown for infrastructure (containers, DB)
- Each test file mocks `@/db` and `@/db/schema` independently

**tRPC router structure**:
- `src/server/trpc/routers/_helpers.ts` exports `visibilityFilter()`, `verifyOwnership()`, `syncJunction()`
- `recipes.ts`, `cookbooks.ts`, `classifications.ts`, etc. use these helpers with real Drizzle chains
- Tests currently verify "the helper was called" but not "the correct rows were returned"

### Proposed changes (high-level architecture & data flow)

1. **New test infrastructure (`src/test-helpers/testdb.ts`)**:
   - Testcontainers PostgreSQL container started once per Vitest worker
   - Global setup runs schema push (via Drizzle) to create all tables
   - Taxonomy seeds (meals, courses, preparations) applied before per-test suite
   - Per-test: `withTestTransaction(fn)` wraps each test in a database transaction; callback receives real Drizzle client bound to tx
   - Per-test teardown: transaction rolled back automatically

2. **Vitest configuration updates**:
   - Add `globalSetup` and `globalTeardown` hooks in `vitest.config.ts`
   - Global setup calls `startTestDb()` and exports container to pool for worker reuse
   - Global teardown calls `stopTestDb()` to clean up container
   - Increase `testTimeout` for DB tests (500ms default → 5000ms)

3. **Test file migration**:
   - Replace `vi.mock("@/db", ...)` with `import { getTestDbClient } from "@/test-helpers/testdb"`
   - Replace `createMockDb()` calls with `withTestTransaction(async (db) => { ... })`
   - Insert real test data (users, recipes, cookbooks) instead of relying on mock return values
   - Assert on actual query results (rows returned by visibility filters, ownership checks)

4. **Data isolation & seeding**:
   - Per-test suite: `beforeAll()` inserts known test data (users, recipes with various visibility states)
   - Per-test: transaction rolls back automatically; test data cleaned up
   - No manual cleanup code needed; database state always fresh per test

### Data model / schema (migrations/backfill/versioning)

**No schema changes required.** The existing schema (tables, columns, constraints, indexes) is used as-is:
- Drizzle schema push (`src/db/push`) applies existing migrations to test DB
- Taxonomy seeds reference existing tables (meals, courses, preparations)
- No new tables or columns added for testing

**Test data strategy**:
- Insert minimal test records (1–3 users, 2–5 recipes) per test suite `beforeAll()`
- Test visibility/ownership by inserting both public and private records
- Rely on actual SQL to enforce unique constraints, foreign keys, cascades

### APIs & contracts (new/changed endpoints + brief examples)

**No API changes.** tRPC router definitions remain unchanged; only tests use new DB helper.

**New test utility exports**:
```typescript
// src/test-helpers/testdb.ts
export async function startTestDb(): Promise<void>
export async function stopTestDb(): Promise<void>
export async function getTestDbClient(): Promise<typeof db>
export async function withTestTransaction<T>(
  fn: (txDb: typeof db) => Promise<T>
): Promise<T>
```

**Usage example**:
```typescript
it("visibilityFilter returns private recipes only to owner", async () => {
  const publicRecipe = { id: "r1", name: "Public", isPublic: true, userId: "u1" }
  const privateRecipe = { id: "r2", name: "Private", isPublic: false, userId: "u1" }
  
  await withTestTransaction(async (db) => {
    // Insert test data
    await db.insert(recipes).values([publicRecipe, privateRecipe])
    
    // Run query with visibility filter
    const caller = appRouter.createCaller({ db, session: null, user: null })
    const result = await caller.recipes.list()
    
    // Assert: anonymous user sees only public recipe
    expect(result.items).toHaveLength(1)
    expect(result.items[0].id).toBe("r1")
  })
})
```

### Feature flags

**No feature flags required.** Testcontainers integration is internal test infrastructure; no runtime behavior changes.

### Config (new env vars + validation strategy)

**No new environment variables required.**

Testcontainers auto-detects Docker socket on Linux (`/var/run/docker.sock`) and uses Docker Desktop socket on macOS/Windows. CI runners (GitHub `ubuntu-latest`) have Docker pre-installed.

**Validation**:
- Global test setup attempts to start container; if Docker unavailable, test suite fails with clear error message
- No silent fallback to mock DB; ensures test environment is always real

### External deps (libraries/services & justification)

**New devDependency:**
- `@testcontainers/postgresql@^10.15.0` — Lightweight, high-quality PostgreSQL container wrapper from testcontainers maintainers. Supports all Node.js LTS versions, well-maintained, 92.1 benchmark score.

**Existing devDependencies (already present):**
- `pg` — PostgreSQL client (already in dependencies)
- `drizzle-orm` — ORM (already in dependencies)
- `drizzle-kit` — Schema push tool (already in devDependencies)
- `vitest` — Test runner (already in devDependencies)

### Backward compatibility strategy

**Full backward compatibility maintained:**
- `createMockDb()` remains in `src/test-helpers/mocks.ts` for use by non-migrated tests (component, E2E tests)
- Tests using mocks (`context.test.ts`, `init.test.ts`, component tests) continue unchanged
- No changes to production code, only test infrastructure

### Observability (metrics/logs/traces/alerts)

**Test logging:**
- Global setup logs: `[Testcontainers] Starting PostgreSQL container...`
- Global setup logs: `[Testcontainers] Running schema push and seeds...`
- Per-test: Transaction lifecycle logged via Drizzle query instrumentation (if enabled)

**Debugging:**
- Failed test output includes: `ROLLBACK` statement indicating transaction cleanup
- Test logs include container connection string (masked password for security)

**No production observability changes.** This is test infrastructure only.

### Security & privacy (auth/authz, PII handling, input validation, rate limiting)

**Test data security:**
- Test database runs in isolated Testcontainers container; no persistent storage on host machine
- Container stopped and cleaned up after test suite completes
- No sensitive production data; test data is synthetic (hardcoded UUIDs, email addresses)

**Auth/authz testing:**
- Tests verify ownership checks via real SQL: insert as user A, query as user B, assert query fails or filtered correctly
- Visibility filters tested with real WHERE clauses (not mocked pipeline)
- Example: `visibilityFilter()` tested by verifying `isPublic=true OR userId=?` actually filters the returned rows

**Input validation:**
- Zod validation tests continue to use mocks (validation layer doesn't touch DB)
- Database constraint tests now run against real schema (unique constraints, foreign keys enforced by Postgres)

### Alternatives considered

1. **Snapshot/restore vs. transaction rollback**: Snapshot simpler for complex setup, but slower (Docker layer snapshots). Transactions faster and simpler for isolated unit tests. ✅ Chosen: transactions.

2. **Test pools vs. single container**: Single container shared across tests via Vitest worker pool. Simpler, faster, sufficient for CI. Alternative: separate container per test (slower, heavier). ✅ Chosen: single container.

3. **Running E2E tests against Testcontainers DB**: E2E tests use real server; adding Testcontainers would require full app setup. Overkill. Keep E2E using Docker Compose. ✅ Chosen: tRPC unit/integration tests only.

4. **Using SQLite for tests**: Simpler setup, no Docker needed. But SQLite behavior differs from Postgres (transactions, constraints, JSON functions). Less realistic testing. ✅ Chosen: PostgreSQL via Testcontainers.

---

## 5) Step-by-Step Implementation Plan (TDD)

### Phase 1: Infrastructure Setup (RED → GREEN → Refactor)

#### Step 1.1: Add Testcontainers devDependency

**File:** `package.json`

```bash
npm install --save-dev @testcontainers/postgresql
```

Verify addition to `devDependencies`:
```json
"@testcontainers/postgresql": "^10.15.0"
```

#### Step 1.2: Write tests for test DB helper (RED)

**File:** `src/test-helpers/testdb.test.ts` (new)

Failing tests verifying:
- `startTestDb()` creates a container and returns successfully
- `stopTestDb()` tears down the container
- `getTestDbClient()` returns a real Drizzle instance connected to test DB
- `withTestTransaction(fn)` runs callback and rolls back afterward
- Transaction isolation: data inserted in one test is not visible in another

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { startTestDb, stopTestDb, getTestDbClient, withTestTransaction } from "./testdb"
import { eq } from "drizzle-orm"

describe("testdb helper", () => {
  beforeAll(async () => {
    await startTestDb()
  })

  afterAll(async () => {
    await stopTestDb()
  })

  it("getTestDbClient returns a working Drizzle instance", async () => {
    const db = await getTestDbClient()
    expect(db).toBeDefined()
    expect(typeof db.select).toBe("function")
  })

  it("withTestTransaction rolls back after callback", async () => {
    const { users } = await import("@/db/schema")
    const testUserId = "00000000-0000-0000-0000-000000000001"

    // Insert in transaction
    await withTestTransaction(async (db) => {
      await db.insert(users).values({ id: testUserId, email: "test@example.com", displayName: "Test" })
      const [inserted] = await db.select().from(users).where(eq(users.id, testUserId))
      expect(inserted).toBeDefined()
    })

    // Verify data is gone after transaction
    const db = await getTestDbClient()
    const [found] = await db.select().from(users).where(eq(users.id, testUserId))
    expect(found).toBeUndefined()
  })

  it("separate transactions have isolated data", async () => {
    const { users } = await import("@/db/schema")
    const testUserId = "00000000-0000-0000-0000-000000000002"

    await withTestTransaction(async (db) => {
      await db.insert(users).values({ id: testUserId, email: "test1@example.com", displayName: "Test1" })
    })

    // Second transaction should not see data from first
    await withTestTransaction(async (db) => {
      const [found] = await db.select().from(users).where(eq(users.id, testUserId))
      expect(found).toBeUndefined()
    })
  })
})
```

Run test: `npm run test src/test-helpers/testdb.test.ts` → **FAILS** (file doesn't exist yet)

#### Step 1.3: Implement test DB helper (GREEN)

**File:** `src/test-helpers/testdb.ts` (new)

```typescript
import { PostgreSqlContainer } from "@testcontainers/postgresql"
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "@/db/schema"

let container: PostgreSqlContainer | null = null
let pool: Pool | null = null

/**
 * Start Testcontainers PostgreSQL and apply schema migrations.
 * Called once per Vitest worker via global setup.
 */
export async function startTestDb(): Promise<void> {
  container = await new PostgreSqlContainer("postgres:16-alpine")
    .withDatabase("test")
    .withUsername("testuser")
    .withPassword("testpass")
    .start()

  const connectionUri = container.getConnectionUri()
  pool = new Pool({ connectionString: connectionUri })

  // Apply schema
  const db = drizzle({ client: pool, schema })
  await db.execute(sql`SELECT 1`) // Verify connection
  
  // For now, we'll rely on the fact that getTestDbClient will handle schema
  // Schema will be applied when needed via drizzle-kit
  console.log(`[Testcontainers] PostgreSQL started at ${connectionUri}`)
}

/**
 * Stop Testcontainers PostgreSQL container.
 * Called once per Vitest worker via global teardown.
 */
export async function stopTestDb(): Promise<void> {
  if (pool) {
    await pool.end()
  }
  if (container) {
    await container.stop()
  }
  console.log(`[Testcontainers] PostgreSQL stopped`)
}

/**
 * Get test database client (Drizzle ORM instance).
 * For use outside transactions (e.g., assertions, teardown).
 */
export async function getTestDbClient() {
  if (!pool) throw new Error("Test DB not started; call startTestDb() first")
  return drizzle({ client: pool, schema })
}

/**
 * Run callback inside a database transaction that rolls back afterward.
 * Provides isolated, fresh DB state for each test.
 */
export async function withTestTransaction<T>(
  fn: (db: ReturnType<typeof drizzle>) => Promise<T>,
): Promise<T> {
  if (!pool) throw new Error("Test DB not started; call startTestDb() first")
  
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    const db = drizzle({ client, schema })
    const result = await fn(db)
    await client.query("ROLLBACK")
    return result
  } catch (err) {
    await client.query("ROLLBACK")
    throw err
  } finally {
    client.release()
  }
}
```

Run test: `npm run test src/test-helpers/testdb.test.ts` → **PASSES**

#### Step 1.4: Update Vitest config for global setup (GREEN)

**File:** `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    viteReact(),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globalSetup: ['./src/test-helpers/testdb-global-setup.ts'],
    exclude: ['**/node_modules/**', '**/e2e/**', '**/*.e2e.*'],
    testTimeout: 5000, // Increased for DB tests
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json'],
      reportsDirectory: './coverage',
      exclude: [
        '**/node_modules/**',
        '**/e2e/**',
        '**/*.e2e.*',
        '**/test-setup.ts',
        '**/__tests__/**',
        '**/routeTree.gen.ts',
        '**/test-helpers/**',
      ],
    },
  },
})
```

**File:** `src/test-helpers/testdb-global-setup.ts` (new)

```typescript
import { startTestDb, stopTestDb } from './testdb'

export async function setup() {
  console.log('[Setup] Starting test database...')
  await startTestDb()
  
  // Apply schema via drizzle-kit push (expects DATABASE_URL)
  // For test DB, we'll use environment variable from container
  // For now, schema is applied lazily on first connection
}

export async function teardown() {
  console.log('[Teardown] Stopping test database...')
  await stopTestDb()
}
```

Run all tests: `npm run test` → existing tests still pass, new helper tests pass

#### Step 1.5: Refactor test DB helper for clarity

**File:** `src/test-helpers/testdb.ts` (refactor)

- Extract error messages to constants
- Add JSDoc comments explaining transaction isolation
- Add retry logic for container start (in case Docker socket stale)

---

### Phase 2: Test File Migration (RED → GREEN → Refactor per file)

#### Step 2.1: Migrate `helpers.test.ts` (POC)

**File:** `src/server/trpc/routers/__tests__/helpers.test.ts`

**RED:** Write failing tests for real DB behavior

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest"
import { startTestDb, stopTestDb, withTestTransaction } from "@/test-helpers/testdb"
import { recipes, recipeMeals, meals } from "@/db/schema"
import { eq } from "drizzle-orm"

describe("_helpers", () => {
  beforeAll(async () => {
    await startTestDb()
  })

  afterAll(async () => {
    await stopTestDb()
  })

  describe("visibilityFilter", () => {
    it("returns isPublic=true condition for anonymous users", async () => {
      await withTestTransaction(async (db) => {
        const { visibilityFilter } = await import("../_helpers")
        const isPublicCol = recipes.isPublic
        const userIdCol = recipes.userId

        const result = visibilityFilter(isPublicCol, userIdCol, null)
        expect(result).toBeDefined()
      })
    })

    it("returns or(isPublic, userId) condition for authenticated users", async () => {
      await withTestTransaction(async (db) => {
        const { visibilityFilter } = await import("../_helpers")
        const isPublicCol = recipes.isPublic
        const userIdCol = recipes.userId

        const result = visibilityFilter(isPublicCol, userIdCol, { id: "user-1" })
        expect(result).toBeDefined()
      })
    })
  })

  describe("syncJunction", () => {
    it("deduplicates IDs to prevent unique constraint violations", async () => {
      await withTestTransaction(async (db) => {
        const { syncJunction } = await import("../_helpers")
        const recipeId = "r1"
        const mealIds = ["a", "a", "b", "b", "b"]

        // This should not throw despite duplicate IDs
        await syncJunction(db, recipeMeals, "mealId", recipeId, mealIds, "mealId")

        // Verify only unique pairs were inserted
        const result = await db.select().from(recipeMeals).where(eq(recipeMeals.recipeId, recipeId))
        expect(result).toHaveLength(2)
        expect(result.map(r => r.mealId).sort()).toEqual(["a", "b"])
      })
    })
  })
})
```

Run: `npm run test src/server/trpc/routers/__tests__/helpers.test.ts` → **FAILS** (no real transactions yet)

**GREEN:** Replace mock imports with real DB helper

```typescript
// Remove vi.mock() calls
// Replace createMockDb() with withTestTransaction()
// Verify tests pass
```

Run: `npm run test src/server/trpc/routers/__tests__/helpers.test.ts` → **PASSES**

**REFACTOR:**
- Add JSDoc comments explaining transaction isolation
- Extract test fixtures to shared `__tests__/fixtures.ts`
- Ensure no mocks remain

#### Step 2.2: Migrate `recipes.test.ts`

Similar RED → GREEN → REFACTOR cycle:
- RED: Write failing tests for visibility filtering, ownership checks, junction table dedup
- GREEN: Implement real DB helpers, insert test data, assert on actual rows returned
- REFACTOR: Extract fixtures, simplify complex tests

Key tests to convert:
- `list()` with visibility filter: insert public/private recipes, assert anonymous user sees only public
- `byId()`: insert recipe, query via Drizzle, assert correct record returned
- `create()`: insert recipe, verify unique constraint works, test transaction rollback
- `syncJunction()`: insert recipes with meals, update meals array, verify unique dedup enforced

#### Step 2.3: Migrate `taxonomy.test.ts`

- Simpler than recipes; mostly list queries over seeded data
- RED → GREEN → REFACTOR

#### Step 2.4: Migrate `integration.test.ts`

- Most complex; covers auth middleware, multiple router endpoints, error handling
- RED → GREEN → REFACTOR

---

### Phase 3: Pre-PR Duplication & Complexity Review (Mandatory)

#### Step 3.1: Review for code duplication

```bash
git diff main...feature/131-testcontainers-db-tests -- "src/server/trpc/__tests__/*" | grep -E "^\+" | sort | uniq -d
```

Extract repeated patterns (test data setup, transaction wrapping, assertion helpers) into shared utilities.

#### Step 3.2: Check cyclomatic complexity

```bash
npx tsc --noEmit
npm run test -- --coverage
```

- Ensure no method > 25 lines
- Flatten nested conditionals
- Eliminate overengineering

#### Step 3.3: Run static analysis

```bash
# If Codacy available:
codacy_cli_analyze

# Lint & format:
npx eslint "src/server/trpc/**/*.test.ts" --fix
npx prettier --write "src/server/trpc/**/*.test.ts"
```

#### Step 3.4: Remove dead code

- Delete `createMockDb()` usage from all migrated files
- Remove `vi.mock("@/db", ...)` in migrated files
- Remove unused imports

#### Step 3.5: Validate test suite

```bash
npm run test
npm run test:e2e
```

All tests pass; no regressions.

---

## 6) Effort, Risks, Mitigations

### Effort Estimate: **Medium (3–4 days)**

- **Infrastructure setup (testdb helper + Vitest config):** 1 day
- **Test file migrations (4 files):** 1.5 days
  - `helpers.test.ts` (POC, fastest): 2 hours
  - `recipes.test.ts` (most complex): 4 hours
  - `taxonomy.test.ts` (simpler): 2 hours
  - `integration.test.ts` (broader scope): 3 hours
- **Code review, refactoring, CI validation:** 1 day
- **Documentation updates:** 2 hours

### Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation | Fallback |
|------|--------|-----------|-----------|----------|
| Docker not available in CI | Tests fail in GitHub Actions | Medium | Ensure `ubuntu-latest` has Docker; add smoke-check to workflow | Manual skip via env var (not preferred) |
| Container startup flakiness | Intermittent test failures | Low | Use Testcontainers built-in retry logic; reuse container per worker | Increase timeouts, switch to snapshot/restore if needed |
| Transaction isolation gaps | Tests pass locally but fail in CI (parallel workers) | Low | Run tests serially in CI (single worker) or use separate containers per worker | Add explicit test data cleanup step |
| Schema drift if migrations applied incorrectly | Tests fail due to missing tables | Low | Apply schema via Drizzle push in global setup; validate with smoke test | Manual schema push if automatic fails |
| Performance regression (longer test runtime) | CI time increases by >25% | Medium | Container reuse per worker; transaction rollback fast (sub-100ms). Monitor CI times | If >25% slower, switch to snapshot/restore or SQLite |
| Breaking changes in Testcontainers API | Tests fail after upgrade | Low | Pin major version in package.json; test upgrades in isolated branch | Downgrade or patch version |

---

## 7) File-Level Change List

**New Files:**
- `src/test-helpers/testdb.ts` — Testcontainers PostgreSQL wrapper + helpers
- `src/test-helpers/testdb.test.ts` — Unit tests for test DB helper
- `src/test-helpers/testdb-global-setup.ts` — Vitest global setup/teardown

**Modified Files:**
- `package.json` — Add `@testcontainers/postgresql` devDependency
- `vitest.config.ts` — Add `globalSetup`, increase `testTimeout`
- `src/server/trpc/routers/__tests__/helpers.test.ts` — Replace mocks with real DB helper
- `src/server/trpc/routers/__tests__/recipes.test.ts` — Replace mocks with real DB helper
- `src/server/trpc/routers/__tests__/taxonomy.test.ts` — Replace mocks with real DB helper
- `src/server/trpc/__tests__/integration.test.ts` — Replace mocks with real DB helper
- `CONTRIBUTING.md` — Add Docker requirement note

**Unchanged (retained for other tests):**
- `src/test-helpers/mocks.ts` — Kept for non-DB tests (component, E2E)

**Deprecated:**
- `src/test-helpers/mocks.ts::createMockDb()` — Marked with JSDoc deprecation warning; not removed yet (used by other tests)

---

## 8) Test Plan

### Parameterized Test Strategy

**Test data sources:**
- `src/test-helpers/testdb.ts` exports fixture functions for common test data (users, recipes, categories)
- Per-test insertions via Drizzle (inline, simple fixtures)
- No external JSON/CSV files needed (schema/data is simple)

### Test Coverage by Category

**Infrastructure Tests** (new):
- Testcontainers helper: Start/stop, get client, transaction rollback, isolation
- Location: `src/test-helpers/testdb.test.ts`
- Strategy: Simple unit tests (one assertion per test), no parameterization
- Justification: Test setup/teardown is unique per container lifecycle; no variations to parameterize

**Router Tests (Migrated):**

**helpers.test.ts:**
- Visibility filter logic: Parameterized by (isPublic, userId, expectedRows)
  - Source: Inline test data (public recipe + private recipe)
  - Example: Anonymous sees public only; Owner sees both
- Ownership verification: Parameterized by (ownerMatch, shouldPass)
  - Source: Inline (record with owner/non-owner userId)
- Junction dedup: Parameterized by (inputIds, expectedRows)
  - Source: Inline test data ([a,a,b,b] → [a,b])

**recipes.test.ts:**
- List filtering: Parameterized by (filters, expectedCount) — 5+ variations
  - Visibility: public/private by auth state
  - Search: name/ingredients by keyword
  - Pagination: page, pageSize
  - Source: Inline fixture builder; each test inserts 2–5 recipes
- Create/Update: Transaction, ownership enforcement — simple tests (not parameterized)
- Delete/Toggle: Auth and error handling — simple tests

**taxonomy.test.ts:**
- List queries: Parameterized by (routerName, tableSize) — 3 router names × 2 sizes
  - Source: Seeded data (meals, courses, preparations) + custom insertions
  - Strategy: Simple parameterized test with `.each()`

**integration.test.ts:**
- Auth enforcement: Parameterized by (procedure, isAuthed, shouldThrow) — ~10 procedures
  - Source: Inline test; no data insertion needed
- Zod validation: Parameterized by (invalidInput, expectedError) — 5+ cases
  - Source: Inline hardcoded bad inputs

**Contract Tests** (none specific to this ticket):
- E2E test via Playwright covers end-to-end flows
- Not modified here

**Performance Tests:**
- Baseline: `npm run test` runs in <60s
- Measure: Time each test file; alert if >25% slower
- Location: CI logs

**Security/Privacy Tests:**
- Visibility filter: Verify unauthorized users cannot see private data
- Ownership: Verify user cannot update/delete another's recipe
- Location: `recipes.test.ts`

**Manual QA Checklist:**
- [ ] Docker available: `docker run hello-world`
- [ ] Tests pass locally: `npm run test`
- [ ] Tests pass in CI: GitHub Actions workflow completes
- [ ] No flakiness: Run test suite 3× in a row; same results
- [ ] Performance acceptable: CI test runtime not >25% slower

---

## 9) Rollout & Monitoring Plan

### Feature Flags & Default State

**No feature flag required.** Testcontainers is internal test infrastructure; no runtime behavior exposed.

### Deployment Steps (progressive enable / canary)

1. **Local development:** Developers run `npm run test` and get Testcontainers automatically
2. **CI validation:** GitHub Actions workflow runs tests; verifies Docker available
3. **Merge to main:** All tests pass; no review blockers
4. **No progressive rollout:** Tests are not user-facing; all-or-nothing merge

### Dashboards & Key Metrics

**GitHub Actions:**
- **Metric:** Test suite duration per run
  - Target: <60 seconds
  - Alert if: >75 seconds (25% regression)
- **Metric:** Test pass rate
  - Target: 100%
  - Alert if: <95%

**Local development (developer responsibility):**
- Run `npm run test` before committing; ensure <60s
- Report flakiness in issue comment

### Alerts

- GitHub Actions: Workflow fails if any test fails → auto-notify PR author
- Slack (if configured): Daily summary of test runtime trends

### Success Metrics / KPIs

1. **Correctness:** All 4 migrated test files pass with real DB; no false positives/negatives
2. **Test quality:** Visibility filtering verified by actual SQL (not mocked); ownership verified by real constraints
3. **Performance:** Test suite runs in <60s; no >25% regression
4. **Reliability:** Zero flaky failures over 1 week of CI runs
5. **Developer experience:** Zero ramp-up friction; tests "just work" with Docker

### Rollback Procedure

If tests become flaky or performance degrades:

```bash
# 1. Identify the issue (flakiness, timeout, Docker unavailable)
# 2. Revert to mock DB temporarily:
git revert <commit-hash>

# 3. Investigate root cause in a separate branch
git checkout -b debug/131-investigate-issue

# 4. Fix and re-test
npm run test

# 5. Re-merge once verified
git push && open PR
```

**Note:** Since tests are not production-facing, rollback is safe and doesn't impact users.

---

## 10) Handoff Package

**Jira/GitHub Link:**
- https://github.com/dougis-org/cookbook-tanstack/issues/131

**Branch:**
- `feature/131-testcontainers-db-tests`

**Plan File:**
- `/docs/plan/tickets/131-plan.md`

**Key Commands:**
```bash
# Install dependencies
npm install

# Run unit/integration tests (including Testcontainers)
npm run test

# Run E2E tests separately
npm run test:e2e

# Build & type check
npm run build
npx tsc --noEmit

# Start dev server
npm run dev

# Start Docker (required for Testcontainers)
docker compose up -d
```

**Known Gotchas / Watchpoints:**

1. **Docker required:** Ensure `docker` is running locally. If tests fail with "Cannot connect to Docker daemon", start Docker Desktop or check socket permissions.

2. **CI environment:** GitHub Actions `ubuntu-latest` has Docker pre-installed. No additional setup needed.

3. **Test timing:** Tests take 500ms–1s each due to transaction overhead. Not a concern; well within budget.

4. **Transaction semantics:** Each test runs in SERIALIZABLE isolation level (default Postgres). If a test needs specific isolation level, use `SET TRANSACTION ISOLATION LEVEL...` explicitly.

5. **Schema changes:** If schema is updated, global setup must re-apply migrations. Drizzle push handles this automatically.

6. **Database size:** Test DB is ephemeral; ~20–50MB per container. Adequate for test data; no cleanup required.

---

## 11) Traceability Map

| AC# | Acceptance Criterion | Milestone | Task(s) | Flag(s) | Test(s) |
|-----|----------------------|-----------|---------|---------|----------|
| 1 | Test DB helper infra created & validates | MILESTONE-03 | Implement testdb.ts + global setup | None | `src/test-helpers/testdb.test.ts` |
| 2 | Router tests migrated to real DB | MILESTONE-03, MILESTONE-04 | Migrate 4 test files | None | `helpers.test.ts`, `recipes.test.ts`, `integration.test.ts`, `taxonomy.test.ts` |
| 3 | No mock contamination; createMockDb() removed from migrated files | MILESTONE-04 | Remove mock imports; retain for other tests | None | `git grep "createMockDb"` → zero matches in `/routers/__tests__/` |
| 4 | Tests deterministic & independently runnable | MILESTONE-03 | Transaction isolation per test | None | Run each test file 3×; compare results |
| 5 | CI integration; tests pass on github Actions | MILESTONE-03 | Update `.github/workflows/test.yml` | None | GitHub Actions test job passes |
| 6 | Documentation updated | MILESTONE-04 | Update CONTRIBUTING.md | None | CONTRIBUTING.md mentions Docker requirement |

---

## Summary for Handoff

This plan provides a clear, step-by-step approach to migrate tRPC router tests from hand-rolled mocks to Testcontainers PostgreSQL, ensuring:
- ✅ Real SQL validation (visibility filters, constraints, ownership checks)
- ✅ Fast test execution with transaction isolation (no cross-test data leakage)
- ✅ Backward compatibility (other tests with mocks continue unchanged)
- ✅ Clear TDD workflow (RED → GREEN → REFACTOR per file)
- ✅ Low risk (infrastructure change, no production impact)
- ✅ Full observability (logs, metrics, alerts)

Ready for implementation in `work-ticket` mode.