## GitHub Issues

- #321

## Why

- Problem statement: Several test helpers currently use `Math.random()` to generate suffixes for resource names (e.g., recipe names, user emails). `Math.random()` is not cryptographically secure and could lead to collisions in parallel test environments or predictable values in sensitive contexts.
- Why now: Aligning with security best practices and improving test robustness by using more reliable uniqueness generators.
- Business/user impact: Reduced risk of flaky tests due to naming collisions and improved adherence to security standards in the codebase.

## Problem Space

- Current behavior: `src/e2e/helpers/auth.ts`, `src/e2e/helpers/cookbooks.ts`, and `src/e2e/helpers/recipes.ts` use `Math.random().toString(36).slice(2, 8)` combined with `Date.now()` to generate suffixes.
- Desired behavior: Use `node:crypto` (e.g., `randomUUID()` or `randomBytes()`) to generate unique, cryptographically secure suffixes.
- Constraints: Must work in the project's Node.js environment (>=20.19.0).
- Assumptions: Centralizing the logic in a new `utils.ts` helper is the most maintainable approach.
- Edge cases considered: Length of the generated suffix (keeping it reasonably short while maintaining uniqueness).

## Scope

### In Scope

- Creation of `src/e2e/helpers/utils.ts` with a `getUniqueSuffix()` helper.
- Refactoring `src/e2e/helpers/auth.ts` to use `getUniqueSuffix()`.
- Refactoring `src/e2e/helpers/cookbooks.ts` to use `getUniqueSuffix()`.
- Refactoring `src/e2e/helpers/recipes.ts` to use `getUniqueSuffix()`.
- Verifying that E2E tests still pass with the new suffixes.

### Out of Scope

- Refactoring `Date.now()` usage that does not involve `Math.random()`.
- Refactoring `Math.random()` in `node_modules` or non-E2E helper files (none were found in `src/`).
- Changing the database ID generation (which already uses ObjectIds).

## What Changes

- New file `src/e2e/helpers/utils.ts` providing `getUniqueSuffix`.
- `src/e2e/helpers/auth.ts`: Replace `Math.random` logic with `getUniqueSuffix`.
- `src/e2e/helpers/cookbooks.ts`: Replace `Math.random` logic with `getUniqueSuffix`.
- `src/e2e/helpers/recipes.ts`: Replace `Math.random` logic with `getUniqueSuffix`.

## Risks

- Risk: The new suffix (using UUID) might be longer than the current 6-character suffix, potentially hitting field length limits if they exist.
  - Impact: Test failures if names exceed allowed lengths.
  - Mitigation: Use a portion of the UUID (e.g., first 8 characters) to keep it compact while remaining significantly more secure and unique than `Math.random()`.

## Open Questions

- Is there a specific maximum length for recipe names or user emails we should be concerned about? (Initial investigation suggests the current names are well within typical limits).
  - Needed from: Requester
  - Blocker for apply: no

## Non-Goals

- Comprehensive security audit of all random number usage in the entire application.
- Performance optimization of suffix generation (the current overhead is negligible).

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
