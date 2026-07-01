---
name: tests
description: Tests for the notes-tier-change-integration-tests change
---

# Tests

## Overview

This change is test-only — the implementation artifact is the test file itself. The TDD cycle here is: write each test case, run it against the existing router to confirm it passes (the router is already implemented), then verify no regressions.

All test cases live in `src/server/trpc/routers/__tests__/admin-notes-tier-change-integration.test.ts`.

Run command: `npx vitest run src/server/trpc/routers/__tests__/admin-notes-tier-change-integration.test.ts`

## Test Cases

### describe: `admin.users.setTier — notes tier visibility`

- [ ] **TC-1 — Downgrade withholds note body** _(Tasks 1–4, Spec: "Downgrade withholds note body on next request")_
  - Creates a Sous Chef user with a note, calls `setTier` → `home-cook`, asserts a new `home-cook` caller receives `{ hasNote: true, note: null }`
  - Maps to: spec scenario "Downgrade withholds note body on next request"

- [ ] **TC-2 — Re-upgrade restores original body** _(Tasks 1–3, 5, Spec: "Re-upgrade restores original note body intact")_
  - Creates a Sous Chef user with note body `'Original body'`, downgrades to `home-cook`, upgrades back to `sous-chef`, asserts a new `sous-chef` caller receives `{ hasNote: true, note: { body: 'Original body', updatedAt: <Date> } }`
  - Maps to: spec scenario "Re-upgrade restores original note body intact"

- [ ] **TC-3 — Upgrade from zero** _(Tasks 1–3, 6, Spec: "Upgrade from zero grants access with no note surfaced")_
  - Creates a `prep-cook` user with no notes, calls `setTier` → `executive-chef`, asserts a new `executive-chef` caller receives `{ hasNote: false, note: null }`
  - Maps to: spec scenario "Upgrade from zero grants access with no note surfaced"

- [ ] **TC-4 — Idempotent downgrade leaves RecipeNote unchanged** _(Tasks 1–3, 7, Spec: "RecipeNote document unchanged after downgrade and idempotent second downgrade")_
  - Creates a Sous Chef user with a note, captures the `RecipeNote` lean document as a snapshot, calls `setTier` → `home-cook` twice (second is a no-op), asserts `RecipeNote.findOne().lean()` deep-equals the snapshot
  - Maps to: spec scenario "RecipeNote document is unchanged after downgrade and idempotent second downgrade"

## Regression Gate

- [ ] **TC-5 — Full `__tests__/` directory passes** _(Task 8)_
  - Run: `npx vitest run src/server/trpc/routers/__tests__/`
  - Expected: zero failures across all existing test files
