---
name: tests
description: TDD test cases for source-slug-backfill
---

# Tests

## Overview

Test cases for the `source-slug-backfill` change. All work follows strict TDD: write a failing test, write the minimum code to pass it, then refactor.

Test file: `src/db/models/source.test.ts` (create if it does not exist; follow the pattern of existing model test files).
Run with: `npx vitest run src/db/models/source.test.ts`

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** — before any implementation code, write the test and confirm it fails.
2. **Write code to pass the test** — minimum code to green.
3. **Refactor** — clean up while keeping tests green.

## Test Cases

### Task 1 — Source model schema

- [ ] **TC-1.1 — slug field is required:** Save a Source without `slug`; expect Mongoose `ValidatorError` with path `slug`.
  - Spec scenario: "Slug is required on new Source documents"

- [ ] **TC-1.2 — slug uniqueness constraint:** Insert two Sources with the same `slug`; expect Mongoose `MongoServerError` with code `11000` (duplicate key).
  - Spec scenario: "Slug uniqueness constraint is enforced"

- [ ] **TC-1.3 — slug index exists:** Inspect `Source.collection.indexes()`; assert an index entry exists on the `slug` field.
  - Spec scenario: "Slug is indexed for lookup performance"

### Task 2 / Task 3 — `backfillSourceSlugs()`

- [ ] **TC-2.1 — slug derived from name:** Insert a Source with `name: "Bon Appetit"` and no `slug`; run `backfillSourceSlugs()`; reload document; assert `slug === "bon-appetit"`.
  - Spec scenario: "Backfill derives correct slug from name"

- [ ] **TC-2.2 — .com name slugification:** Insert a Source with `name: "allrecipies.com"` and no `slug`; run `backfillSourceSlugs()`; assert `slug === "allrecipiescom"`.
  - Spec scenario: "Backfill derives correct slug for .com source names"

- [ ] **TC-2.3 — special characters:** Insert Sources for `"C&H Sugar"`, `"Baker's"`, `"Dad (Massenburg)"`; run `backfillSourceSlugs()`; assert slugs are `"ch-sugar"`, `"bakers"`, `"dad-massenburg"` respectively.
  - Spec scenario: "Backfill derives correct slug from name" (edge cases)

- [ ] **TC-2.4 — idempotency:** Insert a Source with no `slug`; run `backfillSourceSlugs()` twice; assert the slug value is unchanged after the second run and no errors are thrown.
  - Spec scenario: "Backfill is idempotent — skips already-slugged documents"

- [ ] **TC-2.5 — skips already-slugged documents:** Insert two Sources — one with a `slug` already set, one without; run `backfillSourceSlugs()`; assert only the un-slugged document was updated; the pre-existing slug is unchanged.
  - Spec scenario: "Backfill is idempotent — skips already-slugged documents"

- [ ] **TC-2.6 — zero-document warning:** Run `backfillSourceSlugs()` against an empty collection (or where all documents already have slugs); assert the function logs a warning message containing "no un-slugged documents found".
  - Spec scenario: "Backfill logs zero-document warning"

### Task 4 — Seed entrypoint integration

- [ ] **TC-4.1 — seed entrypoint calls backfill:** Confirm `src/db/seeds/index.ts` imports and calls `backfillSourceSlugs()`. This can be a simple import/existence check or a smoke test that the seed entrypoint runs without error.
  - Spec scenario: "Seed entrypoint includes source backfill"

## Traceability

| Test Case | Task | Spec Scenario |
|-----------|------|---------------|
| TC-1.1 | Task 1 | Slug is required on new Source documents |
| TC-1.2 | Task 1 | Slug uniqueness constraint is enforced |
| TC-1.3 | Task 1 | Slug is indexed for lookup performance |
| TC-2.1 | Task 3 | Backfill derives correct slug from name |
| TC-2.2 | Task 3 | Backfill derives correct slug for .com source names |
| TC-2.3 | Task 3 | Backfill derives correct slug from name (edge cases) |
| TC-2.4 | Task 3 | Backfill is idempotent — skips already-slugged documents |
| TC-2.5 | Task 3 | Backfill is idempotent — skips already-slugged documents |
| TC-2.6 | Task 3 | Backfill logs zero-document warning |
| TC-4.1 | Task 4 | Seed entrypoint includes source backfill |
