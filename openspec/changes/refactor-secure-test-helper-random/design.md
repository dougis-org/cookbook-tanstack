## Context

- Relevant architecture: Playwright E2E test suite uses shared helpers in `src/e2e/helpers/` to perform common actions (auth, resource creation).
- Dependencies: `globalThis.crypto` (Web Crypto API, available globally in Node.js >=19).
- Interfaces/contracts touched: `RegisterOptions` in `auth.ts`, `getUniqueRecipeName` in `recipes.ts`, and `getUniqueCookbookName` in `cookbooks.ts`.

## Goals / Non-Goals

### Goals

- Centralize suffix generation for E2E tests.
- Replace insecure `Math.random()` with cryptographically secure alternatives.
- Maintain human-readable yet unique names for test resources.

### Non-Goals

- Refactor all `Date.now()` calls in the codebase.
- Change the length of existing resource names significantly.

## Decisions

### Decision 1: Centralized Utility Helper

- Chosen: Create `src/e2e/helpers/utils.ts`.
- Alternatives considered: Keep logic in-place in each helper file.
- Rationale: Centralization reduces duplication and ensures consistent behavior for all test helpers.
- Trade-offs: Adds a small dependency between helper files.

### Decision 2: Suffix Generation Strategy

- Chosen: `${Date.now()}${randomUUID().slice(0, 8)}` (no separator — alphanumeric-only, safe for username fields).
- Alternatives considered: `randomBytes(3).toString('hex')`, full `randomUUID()`.
- Rationale: Using a slice of a UUID provides high uniqueness while keeping the string length manageable. Including `Date.now()` helps with chronological sorting/debugging of created resources.
- Trade-offs: A slice of a UUID is less unique than a full UUID, but for test suffixes, 8 characters (~16^8 possibilities) is more than sufficient.

## Proposal to Design Mapping

- Proposal element: Use `node:crypto` instead of `Math.random()`.
  - Design decision: Decision 2 (using `crypto.randomUUID().slice(0, 8)`).
  - Validation approach: Manual verification of generated strings and running E2E tests.
- Proposal element: Centralize logic in `utils.ts`.
  - Design decision: Decision 1.
  - Validation approach: Ensure `auth.ts`, `recipes.ts`, and `cookbooks.ts` correctly import and use the new utility.

## Functional Requirements Mapping

- Requirement: Generate unique suffixes for test resources.
  - Design element: `getUniqueSuffix()` in `src/e2e/helpers/utils.ts`.
  - Acceptance criteria reference: All test resources (users, recipes, cookbooks) have unique names.
  - Testability notes: Verify by running parallel tests.

## Non-Functional Requirements Mapping

- Requirement category: Security
  - Requirement: Use cryptographically secure random values.
  - Design element: `crypto.randomUUID()` (global Web Crypto API).
  - Acceptance criteria reference: No `Math.random()` usage in `src/e2e/helpers/`.
  - Testability notes: Static analysis (grep) and code review.

## Risks / Trade-offs

- Risk/trade-off: String length increase.
  - Impact: Potential UI truncation or database field limit hits.
  - Mitigation: Limit the random portion to 8 characters.

## Rollback / Mitigation

- Rollback trigger: Sudden failure of all E2E tests due to name length or character set issues.
- Rollback steps: Revert the changes to `auth.ts`, `recipes.ts`, `cookbooks.ts` and delete `utils.ts`.
- Data migration considerations: None (affects only ephemeral test data).
- Verification after rollback: Confirm E2E tests pass with original logic.

## Operational Blocking Policy

- If CI checks fail: Investigate if the failure is related to resource naming/collisions.
- If security checks fail: Ensure no regressions in `Math.random()` usage were introduced.
- If required reviews are blocked/stale: Re-verify the logic locally and ping reviewers.
- Escalation path and timeout: If blocked for >24h, consult with the security lead.

## Open Questions

- None identified at this stage.
