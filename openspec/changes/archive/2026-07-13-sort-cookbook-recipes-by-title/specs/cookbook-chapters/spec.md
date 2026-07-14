## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Title sort normalization

The system SHALL provide a shared, pure title-normalization function used
by both cookbook-level and chapter-level sort actions. Comparison SHALL be
case-insensitive and SHALL ignore a single leading article — `"a "`,
`"an "`, or `"the "` (case-insensitive, requiring at least one trailing
whitespace character before further title text) — when computing sort
order. The full original title (not the normalized key) SHALL be used for
display.

#### Scenario: Case-insensitive comparison

- **WHEN** the cookbook contains recipes titled "banana Bread" and "Apple Pie"
- **THEN** "Apple Pie" sorts before "banana Bread" regardless of the
  original casing of either title

#### Scenario: Leading article is ignored

- **WHEN** the cookbook contains recipes titled "The Best Chili", "A Great Soup", and "An Amazing Cake"
- **THEN** they sort as "An Amazing Cake", "The Best Chili", "A Great Soup" — i.e. by "Amazing Cake", "Best Chili", "Great Soup" respectively, not by their literal first letters

#### Scenario: Title that is only an article is not stripped to empty

- **WHEN** a recipe is titled exactly "The" (no trailing word)
- **THEN** its full original title "The" is used as the sort key, not an empty string

#### Scenario: Article-like word prefix is not mistaken for an article

- **WHEN** the cookbook contains a recipe titled "Apple Pie"
- **THEN** no characters are stripped from "Apple Pie" when computing its sort key, because "Apple" is not the standalone token "a" followed by whitespace

#### Scenario: Multiple internal spaces after an article are normalized

- **WHEN** a recipe is titled "The  Best Chili" (two spaces after "The")
- **THEN** its sort key is computed from "Best Chili" with the leading article and all following whitespace stripped

### Requirement: ADDED Sort entire cookbook by recipe title

The system SHALL allow the cookbook owner (or a collaborator with edit
access) to sort every recipe in the cookbook by title, via a "Sort Chapters by Recipe Title"
action in the cookbook edit page toolbar, positioned next to the existing
"Build Chapters by Category" action. Each chapter's recipes SHALL be
sorted independently, and any unchaptered recipes SHALL be sorted
independently within their own bucket. No recipe's `chapterId` SHALL be
changed by this action. The action SHALL require explicit confirmation
before executing.

#### Scenario: Sorting a chaptered cookbook sorts each chapter independently

- **WHEN** the owner confirms "Sort Chapters by Recipe Title" on a cookbook with two chapters, each containing recipes in non-alphabetical order
- **THEN** each chapter's recipes are reordered to be alphabetical by title (using the normalization rules above) within that chapter, and each recipe's `chapterId` is unchanged

#### Scenario: Unchaptered recipes are sorted as their own bucket

- **WHEN** the owner confirms "Sort Chapters by Recipe Title" on a cookbook that has chapters and also has recipes with no `chapterId`
- **THEN** the unchaptered recipes are reordered to be alphabetical among themselves, and remain unchaptered (no `chapterId` is assigned to them)

#### Scenario: Sorting a chapter-free cookbook sorts the flat list

- **WHEN** the owner confirms "Sort Chapters by Recipe Title" on a cookbook with zero chapters
- **THEN** all recipes in the cookbook are reordered to be alphabetical by title

#### Scenario: Action requires confirmation

- **WHEN** the owner clicks "Sort Chapters by Recipe Title"
- **THEN** a confirmation prompt is shown describing that this will reorder every chapter's recipes alphabetically, and no reorder mutation is sent until the owner confirms

#### Scenario: Cancelling the confirmation makes no change

- **WHEN** the owner clicks "Sort Chapters by Recipe Title" and then cancels the confirmation prompt
- **THEN** no `reorderRecipes` mutation is sent and recipe order is unchanged

#### Scenario: Non-editor cannot see or trigger the action

- **WHEN** a user without edit access (e.g. a viewer-role collaborator, or a non-collaborator visitor) views the cookbook edit page
- **THEN** the "Sort Chapters by Recipe Title" action is not rendered

### Requirement: ADDED Sort single chapter by recipe title

The system SHALL allow the cookbook owner (or a collaborator with edit
access) to sort only one chapter's recipes by title, via a sort icon in
that chapter's header, alongside the existing rename and delete icons. No
other chapter's recipe order, and no recipe's `chapterId`, SHALL be
affected by this action. The action SHALL require explicit confirmation
before executing.

#### Scenario: Sorting one chapter does not affect other chapters

- **WHEN** the owner confirms the sort icon for Chapter A, which has recipes in non-alphabetical order, while Chapter B also has recipes in non-alphabetical order
- **THEN** Chapter A's recipes are reordered to be alphabetical by title, and Chapter B's recipe order is byte-for-byte unchanged

#### Scenario: Sort icon requires confirmation

- **WHEN** the owner clicks the sort icon on a chapter
- **THEN** a confirmation prompt is shown describing that this will reorder that chapter's recipes alphabetically, and no reorder mutation is sent until the owner confirms

#### Scenario: Cancelling the confirmation makes no change

- **WHEN** the owner clicks a chapter's sort icon and then cancels the confirmation prompt
- **THEN** no `reorderRecipes` mutation is sent and recipe order is unchanged

#### Scenario: Sorting a chapter with 0 or 1 recipes is a safe no-op

- **WHEN** the owner confirms the sort icon on a chapter that has zero or one recipe
- **THEN** the action completes without error and recipe order (trivially) is unchanged

#### Scenario: Non-editor cannot see or trigger the action

- **WHEN** a user without edit access views a chapter header
- **THEN** the chapter-level sort icon is not rendered

## Traceability

- Proposal element: Cookbook-level "Sort Chapters by Recipe Title" sorts every chapter plus
  the unchaptered bucket, independently, without changing chapter
  membership. -> Requirement: ADDED Sort entire cookbook by recipe title
- Proposal element: Per-chapter sort icon sorts only that chapter's
  recipes. -> Requirement: ADDED Sort single chapter by recipe title
- Proposal element: Case-insensitive, article-ignoring comparison
  (a/an/the). -> Requirement: ADDED Title sort normalization
- Proposal element: Both actions require confirmation before executing.
  -> Requirement: ADDED Sort entire cookbook by recipe title (Scenario:
  Action requires confirmation), Requirement: ADDED Sort single chapter by
  recipe title (Scenario: Sort icon requires confirmation)
- Design decision: Decision 1 (reuse `reorderRecipes` flat form) ->
  Requirement: ADDED Sort entire cookbook by recipe title, Requirement:
  ADDED Sort single chapter by recipe title
- Design decision: Decision 2 + Decision 3 (shared utility, regex
  behavior) -> Requirement: ADDED Title sort normalization
- Design decision: Decision 4 (ConfirmModal reuse) -> both ADDED sort
  requirements' confirmation scenarios
- Requirement: ADDED Title sort normalization -> Task(s): implement
  `src/lib/recipeTitleSort.ts` + unit tests
- Requirement: ADDED Sort entire cookbook by recipe title -> Task(s):
  implement "Sort Chapters by Recipe Title" button + confirm modal + integration tests
- Requirement: ADDED Sort single chapter by recipe title -> Task(s):
  implement chapter-header sort icon + confirm modal + integration tests

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Latency budget

- **WHEN** "Sort Chapters by Recipe Title" is confirmed on a cookbook of typical size (tens
  of recipes across a handful of chapters)
- **THEN** the reorder request completes with the same latency
  characteristics as the existing drag-and-drop chapter reorder, since
  both submit a comparable full-cookbook payload to the same mutation

### Requirement: Security

See functional scenarios: "Non-editor cannot see or trigger the action"
(both ADDED sort requirements above). Authorization is enforced by the
existing `fetchEditableCookbook` ownership/collaborator-role check inside
`reorderRecipes`, which this change does not modify.

### Requirement: Reliability

#### Scenario: No recipe is lost or duplicated by a sort

- **WHEN** either sort action is confirmed
- **THEN** the set of recipe IDs present in the cookbook after the action
  is identical (same members, same count) to the set present before the
  action — only ordering within each chapter/unchaptered bucket changes
