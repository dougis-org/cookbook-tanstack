---
name: tests
description: Tests for the private-recipe-notes-tier-docs change
---

# Tests

## Overview

This document outlines the tests for the `private-recipe-notes-tier-docs` change. All work follows strict TDD: write a failing test, make it pass, refactor.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2. **Write code to pass the test:** Write the simplest possible code to make the test pass.
3. **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Task 1 — `docs/user-tier-feature-sets.md` updates

These are content verification tests; no automated test file is needed. Verify manually or via a script.

- [ ] **TC-DOC-1** (Home Cook exclusion): Read `docs/user-tier-feature-sets.md`. The Home Cook section SHALL contain a sentence referencing "private recipe notes" and stating they are not available.
  - Spec: `specs/tier-doc-private-notes/spec.md` — "Home Cook section lists private notes exclusion"
  - Verification: `grep -A 10 "### Home Cook" docs/user-tier-feature-sets.md | grep -i "private recipe notes"`

- [ ] **TC-DOC-2** (Prep Cook exclusion): Read `docs/user-tier-feature-sets.md`. The Prep Cook section SHALL contain a sentence referencing "private recipe notes" and stating they are not available.
  - Spec: `specs/tier-doc-private-notes/spec.md` — "Prep Cook section lists private notes exclusion"
  - Verification: `grep -A 10 "### Prep Cook" docs/user-tier-feature-sets.md | grep -i "private recipe notes"`

- [ ] **TC-DOC-3** (public/private distinction): The exclusion sentences in both sections SHALL reference that public recipe notes remain available (or refer to the private distinction), not simply say "no notes".
  - Spec: `specs/tier-doc-private-notes/spec.md` — "Exclusion sentence references public vs private distinction"

- [ ] **TC-DOC-4** (Markdown validity): The updated file SHALL render without syntax errors. Verify by running `npm run build` (which processes markdown via Vite) or using a markdown linter if available.

### Task 2 — `src/routes/pricing.tsx` refactor and new row

These require a Vitest test in `src/routes/pricing.test.tsx` (or equivalent). Write the test first, confirm it fails, then implement.

- [ ] **TC-PRICE-1** (Private notes row renders for all tiers): Write a test that renders `<TierCard>` for each of the five tiers and asserts a text element matching "Private notes" or "No private notes" is present.
  - Spec: `specs/pricing-card-private-notes/spec.md` — "Sous Chef and Executive Chef cards show Private Recipe Notes available"
  - Test file: `src/routes/pricing.test.tsx`
  - Suggested assertion: `expect(screen.getByText(/private notes/i)).toBeInTheDocument()`

- [ ] **TC-PRICE-2** (Sous Chef shows "✓"): Render `<TierCard tier="sous-chef" ...>` and assert the private notes row text contains "✓".
  - Spec: `specs/pricing-card-private-notes/spec.md` — "Sous Chef and Executive Chef cards show Private Recipe Notes available"

- [ ] **TC-PRICE-3** (Executive Chef shows "✓"): Render `<TierCard tier="executive-chef" ...>` and assert the private notes row text contains "✓".
  - Spec: `specs/pricing-card-private-notes/spec.md` — "Sous Chef and Executive Chef cards show Private Recipe Notes available"

- [ ] **TC-PRICE-4** (Home Cook shows "No private notes"): Render `<TierCard tier="home-cook" ...>` and assert the private notes row text is "No private notes".
  - Spec: `specs/pricing-card-private-notes/spec.md` — "Home Cook, Prep Cook, and Anonymous cards show Private Recipe Notes not included"

- [ ] **TC-PRICE-5** (Prep Cook shows "No private notes"): Render `<TierCard tier="prep-cook" ...>` and assert the private notes row text is "No private notes".
  - Spec: `specs/pricing-card-private-notes/spec.md` — "Home Cook, Prep Cook, and Anonymous cards show Private Recipe Notes not included"

- [ ] **TC-PRICE-6** (No wrapper imports): Confirm `canCreatePrivate` and `canImport` do not appear in `src/routes/pricing.tsx` after the change.
  - Spec: `specs/pricing-card-private-notes/spec.md` — "No wrapper functions imported in pricing.tsx"
  - Verification: `grep -n "canCreatePrivate\|canImport" src/routes/pricing.tsx` should return no results

- [ ] **TC-PRICE-7** (TypeScript compiles): Run `npx tsc --noEmit`. No type errors produced.
  - Spec: `specs/pricing-card-private-notes/spec.md` — "TypeScript compilation succeeds"

### Build Verification

- [ ] **TC-BUILD-1**: `npm run build` completes with no errors after all implementation changes.
- [ ] **TC-BUILD-2**: `npm run test` passes all existing unit tests (no regressions introduced).
