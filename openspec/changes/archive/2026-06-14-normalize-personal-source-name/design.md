## Context

- Relevant architecture: tRPC layer (`src/server/trpc/routers/recipes.ts`), Zod schemas (`recipeFields`)
- Dependencies: Mongoose models (`Source`, `Recipe`)
- Interfaces/contracts touched: `recipes.create` input schema and resolver, `recipes.update` input schema and resolver

## Goals / Non-Goals

### Goals

- Enforce that `personalSourceName` is only saved when `sourceId` equals the Personal source ID.
- Automatically scrub `personalSourceName` on create/update if the `sourceId` doesn't match.
- Add `.trim()` to the `personalSourceName` Zod schema to prevent whitespace-only entries.

### Non-Goals

- Refactoring the entire `recipes.ts` logic.
- Building the frontend form behavior.

## Decisions

### Decision 1: Caching the Personal source ID

- Chosen: Fetch `Source.findOne({ slug: "personal" })` on every create/update request.
- Alternatives considered: Caching the `_id` at the module level.
- Rationale: Fetching per request avoids test flakiness (where the DB is often cleared and re-seeded, changing the `_id`). A MongoDB index lookup on `slug` is extremely fast and will not cause performance issues for mutations.
- Trade-offs: Minor, imperceptible hit to mutation latency. Much higher reliability in test environments.

### Decision 2: Scrubbing mechanism in `update`

- Chosen: Explicitly set `updateData.personalSourceName = null` if the `sourceId` in the input payload doesn't match the Personal source ID.
- Alternatives considered: Using MongoDB `$unset`.
- Rationale: Mongoose handles setting a field to `null` well for unsetting string fields, and it aligns with how other updates are structured in `updateData`.
- Trade-offs: Setting to `null` vs `$unset` is usually functionally equivalent in this app's schema, but we'll ensure it behaves as expected via unit tests.

### Decision 3: Trimming `personalSourceName`

- Chosen: Add `.trim()` before `.max(80)` in the `recipeFields` schema.
- Alternatives considered: Trimming manually in the resolver.
- Rationale: Zod is designed for this exactly.
- Trade-offs: None.

## Proposal to Design Mapping

- Proposal element: Add `.trim()` to `personalSourceName` schema
  - Design decision: Decision 3
  - Validation approach: Zod parses invalid/padded strings correctly. Unit test will verify.
- Proposal element: Fetch Personal source ID dynamically
  - Design decision: Decision 1
  - Validation approach: Mock DB calls in tests or integration test with seeded Source.
- Proposal element: Normalize `personalSourceName` in `create` and `update`
  - Design decision: Decision 2
  - Validation approach: Unit tests covering `create` and `update` with varying `sourceId` values.

## Functional Requirements Mapping

- Requirement: Saving a recipe with `sourceId=Personal` preserves `personalSourceName`.
  - Design element: `create` and `update` logic check for match.
  - Acceptance criteria reference: AC 1 in issue 504.
  - Testability notes: Unit test using the `recipes.create` and `recipes.update` callers.
- Requirement: Saving with any other `sourceId` discards a sent `personalSourceName`.
  - Design element: `create` and `update` normalization rule.
  - Acceptance criteria reference: AC 2 & 3 in issue 504.
  - Testability notes: Unit test using the `recipes.create` and `recipes.update` callers.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Tests must not flake due to caching.
  - Design element: Decision 1 (Fetch per request).
  - Acceptance criteria reference: N/A
  - Testability notes: Ensure tests pass reliably when run in isolation or sequentially.

## Risks / Trade-offs

- Risk/trade-off: Fetching `Source` every mutation.
  - Impact: Negligible latency increase.
  - Mitigation: `slug` is indexed; mutations are low-frequency compared to reads.

## Rollback / Mitigation

- Rollback trigger: If tests fail in CI or mutations start throwing errors due to missing Personal Source.
- Rollback steps: Revert the PR.
- Data migration considerations: None, as this change only strictly limits data being saved.
- Verification after rollback: Ensure recipes can be created/updated normally.

## Operational Blocking Policy

- If CI checks fail: Fix tests before merging. Do not bypass CI.
- If security checks fail: Remediate immediately.
- If required reviews are blocked/stale: Ping team members, escalate after 24h.
- Escalation path and timeout: Refer to standard repository standards.

## Open Questions

- None.
