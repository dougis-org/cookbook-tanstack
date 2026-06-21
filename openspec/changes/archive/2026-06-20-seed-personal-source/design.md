## Context

- Relevant architecture: The application uses a MongoDB database managed via Mongoose models. Seeding is controlled by scripts in `src/db/seeds/` and coordinated by `src/db/seeds/index.ts`.
- Dependencies: Requires `Source` model and the `slug` field (both exist).
- Interfaces/contracts touched: `npm run db:seed` command and the `src/db/seeds/sources.ts` module exports.

## Goals / Non-Goals

### Goals

- Idempotently upsert a `Source` document representing the "Personal" source.
- Ensure the upsert is done by the `slug: "personal"` field to prevent duplication or collisions.
- Wire this upsert function into the default `npm run db:seed` pipeline.
- Verify correctness via automated integration tests in the test suite.

### Non-Goals

- Modifying UI components or form schemas (already integrated to expect the Personal source).
- Automating production database migration scripts.

## Decisions

### Decision 1: Seed sources module extension

- Chosen: Extend the existing `src/db/seeds/sources.ts` module by exporting a new `seedSources()` function.
- Alternatives considered: Creating a new file `src/db/seeds/personal-source.ts`.
- Rationale: The `sources.ts` file already contains the `backfillSourceSlugs` logic. Grouping all source-related seed and backfill behaviors in a single module is cleaner and minimizes file proliferation.
- Trade-offs: Slightly larger `sources.ts` file, but it remains very small overall (<50 lines).

### Decision 2: Seed execution order

- Chosen: Execute `seedSources()` after `backfillSourceSlugs()` in `src/db/seeds/index.ts`.
- Alternatives considered: Executing it before.
- Rationale: Running `backfillSourceSlugs()` first ensures any pre-existing user-defined "Personal" sources are assigned their correct slugs before the seed script runs. This avoids name conflicts and unique index violations when attempting to upsert the seeded record.
- Trade-offs: None.

## Proposal to Design Mapping

- Proposal element: Seed "Personal" source with slug "personal"
  - Design decision: Decision 1 (Extend `sources.ts` with `seedSources()`)
  - Validation approach: Mongoose query assertion in tests verifying the presence and fields of the document.
- Proposal element: Idempotency check
  - Design decision: Decision 1 (Use `updateOne` with `{ upsert: true }` matching by slug)
  - Validation approach: Execute `seedSources()` twice in integration tests and assert that count remains 1 and no error is thrown.
- Proposal element: Wire into `npm run db:seed`
  - Design decision: Decision 2 (Call `seedSources()` in `src/db/seeds/index.ts` after backfill)
  - Validation approach: Run seed script and assert database state.

## Functional Requirements Mapping

- Requirement: Seeding Personal Source
  - Design element: `seedSources()` function
  - Acceptance criteria reference: specs/personal-source-seed/spec.md
  - Testability notes: Fully testable via Vitest on local clean database instance.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Idempotency (running multiple times must not crash or duplicate records)
  - Design element: `Source.updateOne({ slug: 'personal' }, { $set: { name: 'Personal', slug: 'personal' } }, { upsert: true })`
  - Acceptance criteria reference: specs/personal-source-seed/spec.md
  - Testability notes: Test runs seed twice on clean database.

## Risks / Trade-offs

- Risk/trade-off: Seed function could accidentally overwrite user-modified fields if more fields are added in the future.
  - Impact: Minimal, as "Personal" is a system-reserved source.
  - Mitigation: The seeded fields are restricted to `name` and `slug` only.

## Rollback / Mitigation

- Rollback trigger: Seeding script fails in production or blocks startup.
- Rollback steps: Revert the code changes in `src/db/seeds/sources.ts` and `src/db/seeds/index.ts`.
- Data migration considerations: The "Personal" source is required for the application's personal source feature. Removing it will cause UI fallback behaviors to trigger.
- Verification after rollback: Verify that `npm run db:seed` runs successfully without failures.

## Operational Blocking Policy

- If CI checks fail: Block pull request merge and address compilation or test failures.
- If security checks fail: Remediate any dependency or code vulnerabilities flagged by Snyk or Codacy.
- If required reviews are blocked/stale: Re-request review from reviewers. Do not force merge or bypass gates.
- Escalation path and timeout: If blocked on environment issues, consult team lead.

## Open Questions

None.
