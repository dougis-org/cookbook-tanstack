## Context

- Relevant architecture: `Source` is a Mongoose model in `src/db/models/source.ts`, barrel-exported from `src/db/models/index.ts`. Seeds live in `src/db/seeds/`. The `slugify()` utility was moved from `scripts/migration/lib/transformHelpers.ts` to `src/lib/slugify.ts` as part of this change so that production runtime code can import it without depending on the migration scripts directory.
- Dependencies: No runtime dependencies on other in-flight changes. This change is a prerequisite for Issue B (seed Personal source) and Issue F (SourceSelector UI).
- Interfaces/contracts touched: `ISource` TypeScript interface, `sourceSchema` Mongoose schema, `src/db/seeds/index.ts` entrypoint.

## Goals / Non-Goals

### Goals

- Add `slug` to `ISource` and `sourceSchema` with `required`, `unique`, and `index` constraints.
- Backfill all 150 existing prod Source documents with a derived slug.
- Ensure the backfill is idempotent, logged, and safe to re-run.
- Confirm uniqueness constraint is enforceable (collision-free — already verified).

### Non-Goals

- Seeding the "Personal" source document (Issue B).
- Slug collision resolution logic at the API layer (future concern).
- Changing `slugify()` implementation.

## Decisions

### Decision 1: Move `slugify()` to `src/lib/slugify.ts` for shared use

- Chosen: The `slugify()` function was extracted from `scripts/migration/lib/transformHelpers.ts` and placed at `src/lib/slugify.ts`. Both the seed (`src/db/seeds/sources.ts`) and the tRPC router (`src/server/trpc/routers/sources.ts`) import from this shared location.
- Alternatives considered: Keep in `scripts/migration/`; inline per-call-site; npm package.
- Rationale: Production runtime code (tRPC router) cannot safely depend on files in `scripts/migration/` — those directories are often excluded from production builds. Moving to `src/lib/` follows the established project pattern for shared utilities and keeps the function co-located with the code that uses it.
- Trade-offs: The function implementation is now duplicated at `scripts/migration/lib/transformHelpers.ts` (kept for migration-script backwards compatibility) and `src/lib/slugify.ts`. A future cleanup can remove the `scripts/` copy once all migration scripts are updated to import from `src/lib/`.

### Decision 2: Deploy order — backfill before enforcing `required: true`

- Chosen: The schema change ships with `required: true` but the backfill script must run against the target database **before** the application reads any Source documents under the new schema. In practice: run the seed against prod Atlas before deploying the app build.
- Alternatives considered: Deploy `required: false` first, backfill, then tighten. Two deploys.
- Rationale: The sources collection has no active writes between deploys. A single coordinated deploy + seed run is lower risk than two deploys.
- Trade-offs: Requires disciplined deploy ordering. Documented in tasks.md as an explicit step.

### Decision 3: Backfill lives in `src/db/seeds/sources.ts`

- Chosen: New file `src/db/seeds/sources.ts` exporting a `backfillSourceSlugs()` function, called from `src/db/seeds/index.ts`.
- Alternatives considered: Standalone migration script in `scripts/migration/`; one-off admin endpoint.
- Rationale: The seed runner is the established pattern for idempotent data operations in this project. Placing the backfill here makes it re-runnable via `npm run db:seed` and consistent with how meals/courses/preparations are managed.
- Trade-offs: Unlike meals/courses, this is not seeding new records — it's updating existing ones. The function name `backfillSourceSlugs` makes this intent clear. Future source seeds (e.g., "Personal") will be a separate addition.

### Decision 4: Idempotency via `$set` only when slug is absent, using `bulkWrite`

- Chosen: Query `{ slug: { $exists: false } }` to find un-slugged documents; derive slug from `name` for each; issue a single `Source.bulkWrite()` to apply all updates. Documents already having a slug are skipped entirely.
- Alternatives considered: Unconditional `updateMany` with `$set: { slug: slugify(name) }`; sequential `updateOne` per document.
- Rationale: Skip-if-present prevents accidental overwrite if a slug was manually assigned. `bulkWrite` is more efficient than sequential round-trips and avoids per-document latency at scale.
- Trade-offs: Requires a fetch-then-bulk-update pattern. At 150 documents the performance difference is negligible, but the pattern is correct at any scale.

## Proposal to Design Mapping

- Proposal element: Add `slug` to `ISource` and `sourceSchema`
  - Design decision: Decision 1 (slugify reuse), Decision 2 (deploy order)
  - Validation approach: TypeScript compilation; Mongoose schema unit test asserts field presence and uniqueness option

- Proposal element: Backfill existing 150 prod documents
  - Design decision: Decision 3 (seeds location), Decision 4 (idempotency)
  - Validation approach: Integration test asserts all documents have a slug after running; re-running produces no errors

- Proposal element: Idempotent, safe to re-run
  - Design decision: Decision 4
  - Validation approach: Unit test runs backfill twice, asserts document count unchanged and no duplicate slugs

- Proposal element: No existing recipe `sourceId` references broken
  - Design decision: Additive-only field change
  - Validation approach: Existing recipe tests pass without modification; no recipe documents are touched

## Functional Requirements Mapping

- Requirement: `ISource` includes `slug: string`
  - Design element: TypeScript interface update in `src/db/models/source.ts`
  - Acceptance criteria reference: specs/source-slug.md — schema spec
  - Testability notes: TypeScript strict mode enforces at compile time; Mongoose schema test validates at runtime

- Requirement: Backfill is idempotent and safe to re-run
  - Design element: Decision 4 — skip-if-present query
  - Acceptance criteria reference: specs/source-slug.md — backfill spec
  - Testability notes: Test runs `backfillSourceSlugs()` twice; asserts same slug values, no errors, count unchanged

- Requirement: Unit test asserts uniqueness constraint
  - Design element: Mongoose `unique: true` on `slug` field
  - Acceptance criteria reference: specs/source-slug.md — schema spec
  - Testability notes: Test attempts to insert two Sources with the same slug; expects Mongoose duplicate key error

- Requirement: No existing recipe `sourceId` references broken
  - Design element: Additive schema change only
  - Acceptance criteria reference: Existing recipe test suite
  - Testability notes: No recipe model or test changes required; existing tests remain green

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Backfill must not fail silently
  - Design element: `backfillSourceSlugs()` logs count of documents updated and warns if zero documents were found
  - Acceptance criteria reference: specs/source-slug.md — backfill spec
  - Testability notes: Console output assertions in integration test

- Requirement category: operability
  - Requirement: Re-runnable via standard `npm run db:seed`
  - Design element: Decision 3 — wired into `src/db/seeds/index.ts`
  - Acceptance criteria reference: specs/source-slug.md — backfill spec
  - Testability notes: Manual verification; seed entrypoint test calls all seed functions

- Requirement category: performance
  - Requirement: Backfill completes in reasonable time
  - Design element: Sequential fetch-and-update loop; 150 documents — no batching needed
  - Acceptance criteria reference: N/A (trivial at this scale)
  - Testability notes: Not tested; acceptable by inspection

## Risks / Trade-offs

- Risk/trade-off: Duplicate `slugify()` implementation in `scripts/migration/` and `src/lib/`
  - Impact: The two implementations could diverge if one is updated but not the other.
  - Mitigation: Both currently have identical implementations. A follow-up cleanup task can remove the `scripts/migration/` copy once migration scripts are updated to import from `src/lib/slugify.ts`.

- Risk/trade-off: Deploy ordering requirement
  - Impact: If app deploys before backfill runs, Source reads fail validation on `slug: required`
  - Mitigation: Explicit numbered step in tasks.md. Consider deploying with `required: false` and a follow-up tighten if coordinated deploy is not feasible.

## Rollback / Mitigation

- Rollback trigger: Backfill fails mid-run, or unique index creation fails on Atlas.
- Rollback steps:
  1. Drop the partial `slug` index on the `sources` collection in Atlas.
  2. Revert `src/db/models/source.ts` to remove `slug` field.
  3. Redeploy previous app build.
- Data migration considerations: Backfill only adds a field; rollback leaves documents with `slug` present but schema no longer reads it — harmless. Can clean up with `db.sources.updateMany({}, { $unset: { slug: "" } })` if desired.
- Verification after rollback: `db.sources.findOne()` confirms no `slug` field; app starts without errors.

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the failing check before proceeding. No exceptions.
- If security checks fail: Treat as a blocker. This change touches DB schema and seed scripts — any flagged issue must be resolved.
- If required reviews are blocked/stale: Ping the reviewer after 24 hours. Escalate to repo owner after 48 hours.
- Escalation path and timeout: If blocked beyond 48 hours with no response, escalate to project lead to unblock or reassign.

## Open Questions

- None. All design decisions are resolved based on collision analysis and established project patterns.
