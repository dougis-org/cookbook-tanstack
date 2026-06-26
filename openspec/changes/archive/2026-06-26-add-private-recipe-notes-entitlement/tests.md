---
name: tests
description: Tests for the add-private-recipe-notes-entitlement change
---

# Tests

## Overview

This document outlines the tests for the `add-private-recipe-notes-entitlement` change. All work follows a strict TDD process: write a failing test first, make it pass with the simplest implementation, then refactor.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before writing any implementation code, write a test that captures the requirements. Run the test and confirm it fails.
2. **Write code to pass the test:** Write the simplest possible implementation to make the test pass.
3. **Refactor:** Improve code quality while keeping tests green.

## Test Cases

### Task: Add `canUsePrivateRecipeNotes` to `src/lib/tier-entitlements.ts`

All tests live in `src/lib/__tests__/tier-entitlements.test.ts`.

Specs traced: `specs/tier-entitlements/spec.md`

Run command: `npx vitest run src/lib/__tests__/tier-entitlements.test.ts`

- [ ] `canUsePrivateRecipeNotes('anonymous')` → `false`
  - Spec scenario: "Returns false for tiers below sous-chef"
  - TDD: Add import + test first → confirm red → add function → green

- [ ] `canUsePrivateRecipeNotes('home-cook')` → `false`
  - Spec scenario: "Returns false for tiers below sous-chef"
  - TDD: Covered by same `it.each` row — add row → red → implement → green

- [ ] `canUsePrivateRecipeNotes('prep-cook')` → `false`
  - Spec scenario: "Returns false for tiers below sous-chef"
  - TDD: Covered by same `it.each` row

- [ ] `canUsePrivateRecipeNotes('sous-chef')` → `true`
  - Spec scenario: "Returns true for sous-chef"
  - TDD: Add row → red (until threshold set to sous-chef) → green

- [ ] `canUsePrivateRecipeNotes('executive-chef')` → `true`
  - Spec scenario: "Returns true for executive-chef"
  - TDD: Add row → green once sous-chef threshold is in place

- [ ] `canUsePrivateRecipeNotes(null)` → `false`
  - Spec scenario: "Returns false for null tier"
  - TDD: Add row → confirm red if null not handled → green via `hasAtLeastTier` defaulting

- [ ] `canUsePrivateRecipeNotes(undefined)` → `false`
  - Spec scenario: "Returns false for undefined tier"
  - TDD: Add row → green via `hasAtLeastTier` defaulting

### Task: Update `docs/user-tier-feature-sets.md`

This task produces no automated tests. Validation is by human review during PR.

- [ ] "Private Recipe Notes" entry exists in the Sous Chef section
  - Spec scenario: "Private Recipe Notes appears under Sous Chef"
  - Validation: open file, confirm entry present

- [ ] "Private Recipe Notes" entry exists in the Executive Chef section (or explicitly noted as inherited)
  - Spec scenario: "Private Recipe Notes appears under Executive Chef"
  - Validation: open file, confirm entry present

- [ ] Entry includes a note distinguishing Private Recipe Notes from the public `note` field on Recipe documents
  - Spec scenario: "Distinction from public note field is documented"
  - Validation: human review during PR
