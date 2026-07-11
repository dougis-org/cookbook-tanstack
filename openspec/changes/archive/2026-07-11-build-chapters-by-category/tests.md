---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `build-chapters-by-category` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Grouping/merge helper (unit) — maps to Execution task "grouping/merge helper" and spec scenarios under "ADDED Build chapters by category"

- [ ] Groups unchaptered recipes by `classificationName` into distinct category buckets. — Scenario: (implicit grouping precondition for) "Category matching an existing chapter name merges instead of duplicating"
- [ ] A recipe with `classificationId: null` is placed in an `"Uncategorized"` bucket. — Scenario: "Uncategorized recipes get their own chapter"
- [ ] A category name that case-insensitively/trim-matches an existing chapter name (`"dessert "` vs `"Dessert"`) resolves to a merge into that chapter, not a new chapter. — Scenario: "Category matching an existing chapter name merges instead of duplicating"
- [ ] A category name that does not match any existing chapter name resolves to a "create new chapter" action. — Scenario: "New chapters are ordered alphabetically after existing chapters"
- [ ] New chapters are assigned `orderIndex` values alphabetically by category name (locale-aware), starting at `maxExistingOrderIndex + 1`. — Scenario: "New chapters are ordered alphabetically after existing chapters"
- [ ] On a cookbook with zero existing chapters, new chapters start at `orderIndex: 0`. — Scenario: "First-chapter creation parity"
- [ ] Already-chaptered recipe stubs are excluded from grouping entirely (not included in any bucket). — Scenario: "Only unchaptered recipes are examined"
- [ ] When there are no unchaptered recipes, the helper returns empty created/merged results. — Scenario: "No unchaptered recipes is a no-op"

### `cookbooks.buildChaptersByCategory` mutation (unit/integration, mocked models) — maps to Execution task "buildChaptersByCategory mutation" and spec scenarios under "ADDED Build chapters by category"

- [ ] `dryRun: true` returns a summary (`{ created, merged }`) without calling `Cookbook.findByIdAndUpdate`. — Scenario: "Dry-run preview does not modify data"
- [ ] Commit (no `dryRun`, or `dryRun: false`) calls `Cookbook.findByIdAndUpdate` exactly once with `$set` covering both `chapters` and `recipes`. — Scenario: "Full-state replace is atomic"
- [ ] A pre-existing chaptered recipe stub's `chapterId` and `orderIndex` are byte-identical before and after commit. — Scenario: "Only unchaptered recipes are examined"
- [ ] A recipe with `classificationId: null` ends up with a `chapterId` matching a chapter named `"Uncategorized"` after commit. — Scenario: "Uncategorized recipes get their own chapter"
- [ ] A recipe whose category matches an existing chapter name (case-insensitive/trimmed) ends up with that chapter's `_id` as `chapterId`, and that chapter's `orderIndex` is unchanged. — Scenario: "Category matching an existing chapter name merges instead of duplicating"
- [ ] Multiple new categories produce chapters in alphabetical `orderIndex` order, appended after the pre-existing max `orderIndex`. — Scenario: "New chapters are ordered alphabetically after existing chapters"
- [ ] On a chapter-free cookbook with recipes spanning categories, commit creates chapters starting at `orderIndex: 0` and assigns every recipe a `chapterId`. — Scenario: "First-chapter creation parity"
- [ ] When every recipe stub already has a `chapterId`, commit performs no writes and returns zero created/merged. — Scenario: "No unchaptered recipes is a no-op"
- [ ] A caller who is neither the cookbook owner nor an `editor` collaborator receives a `FORBIDDEN` `TRPCError`, and no write occurs. — Scenario: "Non-owner/non-editor cannot build chapters by category"
- [ ] An owner calling the mutation succeeds (positive authorization case, mirrors existing `createChapter`/`deleteChapter` owner tests). — Scenario: (authorization happy path for) "ADDED Build chapters by category"
- [ ] An `editor` collaborator calling the mutation succeeds (positive authorization case). — Scenario: (authorization happy path for) "ADDED Build chapters by category"

### Cookbook detail page — button (component) — maps to Execution task "button and preview/confirm modal" and spec scenarios under "ADDED Cookbook detail header 'Build Chapters by Category' action"

- [ ] The "Build Chapters by Category" button renders in the header for the cookbook owner. — Scenario: "Button visible to owner and editor collaborators"
- [ ] The "Build Chapters by Category" button renders in the header for an `editor` collaborator. — Scenario: "Button visible to owner and editor collaborators"
- [ ] The "Build Chapters by Category" button does not render for a viewer who is neither owner nor `editor` collaborator. — Scenario: "Button not rendered for non-owner, non-editor viewers"
- [ ] The button is rendered with `disabled` when every recipe stub already has a `chapterId`. — Scenario: "Button disabled when there are no unchaptered recipes"
- [ ] The button is rendered with `disabled` when the cookbook has zero recipes. — Scenario: "Button disabled when there are no unchaptered recipes"

### Cookbook detail page — preview/confirm modal (component) — maps to Execution task "button and preview/confirm modal" and spec scenarios under "ADDED Cookbook detail header 'Build Chapters by Category' action"

- [ ] Clicking the enabled button triggers a `dryRun: true` call and, once resolved, opens a modal. — Scenario: "Clicking the button shows a preview before committing"
- [ ] The modal renders one row per category to be created (with recipe count) and one row per category merging into an existing chapter (with recipe count and target chapter name), based on the mocked dry-run response. — Scenario: "Clicking the button shows a preview before committing"
- [ ] No chapters are created and no mutation without `dryRun` is called while the modal is open and unconfirmed. — Scenario: "Clicking the button shows a preview before committing"
- [ ] Confirming the modal calls the mutation without `dryRun`, closes the modal on success, and the rendered cookbook chapters/recipes reflect the new grouping. — Scenario: "Confirming the preview commits the operation"
- [ ] Cancelling/closing the modal calls no mutation and leaves the cookbook's chapters/recipes unchanged. — Scenario: "Cancelling the preview makes no changes"

### End-to-end (Playwright) — maps to Validation task "Run E2E tests" and the full added-requirements flow

- [ ] As the cookbook owner, with a cookbook containing unchaptered recipes across two categories (one matching an existing chapter name), click "Build Chapters by Category", verify the preview modal contents, confirm, and verify the cookbook detail page now shows the merged and newly created chapters with the correct recipes in each. — Scenario: "Clicking the button shows a preview before committing" + "Confirming the preview commits the operation"
- [ ] As a non-owner, non-editor viewer, verify the "Build Chapters by Category" button is absent from the page. — Scenario: "Button not rendered for non-owner, non-editor viewers"

## Non-Functional Test Cases

- [ ] Assert `buildChaptersByCategory` (dry-run or commit) issues exactly one `Recipe.find` call and, for commit, exactly one `Cookbook.findByIdAndUpdate` call — no per-recipe queries or writes. — NFAC: "Performance / Latency budget"
