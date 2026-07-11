## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Build chapters by category

The system SHALL allow the cookbook owner or an `editor` collaborator to bulk-create/merge chapters via `cookbooks.buildChaptersByCategory`. The operation SHALL examine only recipe stubs with no `chapterId`, group them by the recipe's category (`classificationName`, or `"Uncategorized"` when the recipe has no `classificationId`), and for each group either merge into an existing chapter whose name matches case-insensitively and trimmed, or create a new chapter. The entire result SHALL be applied via a single atomic update.

#### Scenario: Only unchaptered recipes are examined

- **Given** a cookbook has one existing chapter "Family Favorites" containing recipe A, and recipes B and C are not in any chapter
- **When** the owner calls `buildChaptersByCategory`
- **Then** recipe A's `chapterId` and `orderIndex` are unchanged, and only recipes B and C are grouped and assigned into chapters

#### Scenario: Uncategorized recipes get their own chapter

- **Given** an unchaptered recipe has `classificationId` set to `null`
- **When** `buildChaptersByCategory` is called
- **Then** a chapter named "Uncategorized" is created (or merged into, if one already exists by that name) and the recipe is assigned to it

#### Scenario: Category matching an existing chapter name merges instead of duplicating

- **Given** a cookbook has an existing chapter named "Dessert" and an unchaptered recipe whose category is "dessert "
- **When** `buildChaptersByCategory` is called
- **Then** the recipe is assigned to the existing "Dessert" chapter, that chapter's `orderIndex` is unchanged, and no new "Dessert"-named chapter is created

#### Scenario: New chapters are ordered alphabetically after existing chapters

- **Given** a cookbook has one existing chapter at `orderIndex: 0` and unchaptered recipes spanning categories "Breakfast" and "Appetizer", neither of which matches an existing chapter name
- **When** `buildChaptersByCategory` is called
- **Then** a new "Appetizer" chapter is created at `orderIndex: 1` and a new "Breakfast" chapter is created at `orderIndex: 2`

#### Scenario: First-chapter creation parity

- **Given** a cookbook has no chapters and its recipes span two categories
- **When** `buildChaptersByCategory` is called
- **Then** two new chapters are created starting at `orderIndex: 0`, and every recipe stub receives a `chapterId` matching its category's chapter

#### Scenario: No unchaptered recipes is a no-op

- **Given** every recipe stub in a cookbook already has a `chapterId`
- **When** `buildChaptersByCategory` is called
- **Then** no chapters are created, no recipe stubs are modified, and the returned summary reports zero created and zero merged groups

#### Scenario: Full-state replace is atomic

- **When** `buildChaptersByCategory` commits (i.e. `dryRun` is not set)
- **Then** the entire `chapters` array and the entire `recipes` array are replaced in a single `$set` operation on the cookbook document

#### Scenario: Non-owner/non-editor cannot build chapters by category

- **When** a user who is neither the cookbook owner nor an `editor` collaborator calls `buildChaptersByCategory`
- **Then** the server returns a FORBIDDEN error and no data is modified

#### Scenario: Dry-run preview does not modify data

- **When** `buildChaptersByCategory` is called with `dryRun: true`
- **Then** the same grouping/merge computation runs and is returned in the summary, but no chapters are created and no recipe stubs are modified

### Requirement: ADDED Cookbook detail header "Build Chapters by Category" action

The cookbook detail page SHALL show a "Build Chapters by Category" button to the owner and to `editor` collaborators, alongside "+ New Chapter" and "+ Add Recipe". Clicking it SHALL open a preview modal (populated via a dry-run call) summarizing the chapters to be created and the chapters recipes will merge into, with a confirm action that commits the operation.

#### Scenario: Button visible to owner and editor collaborators

- **When** an owner or `editor` collaborator views a cookbook detail page
- **Then** the "Build Chapters by Category" button is rendered in the header alongside "+ New Chapter" and "+ Add Recipe"

#### Scenario: Button not rendered for non-owner, non-editor viewers

- **When** a viewer who is not the owner or an `editor` collaborator views a cookbook detail page
- **Then** the "Build Chapters by Category" button is not rendered

#### Scenario: Button disabled when there are no unchaptered recipes

- **Given** every recipe in the cookbook already has a `chapterId`, or the cookbook has no recipes
- **When** the owner views the cookbook detail page
- **Then** the "Build Chapters by Category" button is rendered but disabled

#### Scenario: Clicking the button shows a preview before committing

- **Given** a cookbook has unchaptered recipes spanning two categories, one of which matches an existing chapter name
- **When** the owner clicks "Build Chapters by Category"
- **Then** a modal opens showing one chapter to be created and one chapter to be merged into, each with its recipe count, and no chapters are created until the owner confirms

#### Scenario: Confirming the preview commits the operation

- **When** the owner confirms the preview modal
- **Then** `buildChaptersByCategory` is called without `dryRun`, the cookbook detail view reflects the newly created/merged chapters, and the modal closes

#### Scenario: Cancelling the preview makes no changes

- **When** the owner closes or cancels the preview modal instead of confirming
- **Then** no mutation is called and the cookbook's chapters/recipes are unchanged

## Traceability

- Proposal element: New `cookbooks.buildChaptersByCategory` mutation -> Requirement: "ADDED Build chapters by category"
- Proposal element: New "Build Chapters by Category" button + preview/confirm modal -> Requirement: "ADDED Cookbook detail header 'Build Chapters by Category' action"
- Design decision: Decision 1 (dryRun flag) -> Requirement: "ADDED Build chapters by category" (Scenario: Dry-run preview does not modify data)
- Design decision: Decision 2 (classificationName / Uncategorized fallback) -> Requirement: "ADDED Build chapters by category" (Scenario: Uncategorized recipes get their own chapter)
- Design decision: Decision 3 (case-insensitive/trimmed merge matching) -> Requirement: "ADDED Build chapters by category" (Scenario: Category matching an existing chapter name merges instead of duplicating)
- Design decision: Decision 4 (alphabetical new-chapter ordering) -> Requirement: "ADDED Build chapters by category" (Scenario: New chapters are ordered alphabetically after existing chapters)
- Design decision: Decision 5 (atomic single `$set` write) -> Requirement: "ADDED Build chapters by category" (Scenario: Full-state replace is atomic)
- Design decision: Decision 6 (authorization via `fetchEditableCookbook`) -> Requirement: "ADDED Build chapters by category" (Scenario: Non-owner/non-editor cannot build chapters by category)
- Design decision: Decision 7 (button disabled state, dry-run-backed preview) -> Requirement: "ADDED Cookbook detail header 'Build Chapters by Category' action" (all scenarios)
- Requirement: "ADDED Build chapters by category" -> Task(s): server mutation implementation, unit tests
- Requirement: "ADDED Cookbook detail header 'Build Chapters by Category' action" -> Task(s): UI button + modal implementation, component/e2e tests

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Latency budget

- **Given** a cookbook with up to a few hundred recipes (consistent with existing cookbook sizes handled by `reorderRecipes`)
- **When** `buildChaptersByCategory` is called (dry-run or commit)
- **Then** the operation completes as a single additional `Recipe.find` query plus one `Cookbook.findByIdAndUpdate` call, with no per-recipe round trips

### Requirement: Security

See functional scenario: "Non-owner/non-editor cannot build chapters by category".

### Requirement: Reliability

See functional scenario: "Full-state replace is atomic".
