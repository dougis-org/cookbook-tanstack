## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Recipe position label in print view

The system SHALL render a `#N` position label at the bottom of each recipe section in the cookbook print view, where N is the 1-based order position of the recipe.

#### Scenario: Position label renders for each recipe

- **Given** a cookbook with 3 recipes in order
- **When** the print view (`/cookbooks/:id/print`) renders
- **Then** each recipe section contains a label `#1`, `#2`, and `#3` respectively at the bottom of the section

#### Scenario: Position label is absent when recipe not in page map

- **Given** a recipe whose ID is not present in the page map (defensive edge case)
- **When** the print view renders
- **Then** no `#N` label renders for that section and no error is thrown

#### Scenario: Position label is visible on screen in displayonly mode

- **Given** the print view is accessed with `?displayonly=1`
- **When** the page renders
- **Then** the `#N` label is visible (muted gray) without triggering the print dialog

---

## MODIFIED Requirements

### Requirement: MODIFIED TOC position reference format

The system SHALL display `#N` (e.g., `#3`) instead of `pg N` in Table of Contents recipe rows.

#### Scenario: TOC rows use hash format

- **Given** a cookbook TOC with recipes
- **When** the TOC renders
- **Then** each recipe row shows `#N` and contains no `pg` prefix text

### Requirement: MODIFIED Alphabetical index position reference format

The system SHALL display `#N` instead of `pg N` in alphabetical index rows.

#### Scenario: Index rows use hash format

- **Given** a cookbook alphabetical index
- **When** the index renders
- **Then** each recipe row shows `#N` and contains no `pg` prefix text

---

## REMOVED Requirements

### Requirement: REMOVED `pg N` label format

Reason for removal: Replaced by `#N` in all three locations (TOC, alphabetical index, print view footer) to accurately represent order position rather than physical page count.

---

## Traceability

- Proposal: "Add `#N` to each recipe section in print view" → Requirement: ADDED Recipe position label in print view
- Proposal: "Change `pg N` → `#N` in TOC and index" → Requirement: MODIFIED TOC position reference format, MODIFIED Alphabetical index position reference format
- Design Decision 1 (`#N` format) → All three requirements
- Design Decision 2 (wrapper div) → ADDED Recipe position label in print view
- Design Decision 3 (gray styling) → ADDED Recipe position label / Scenario: visible on screen
- ADDED Recipe position label → Task: Update print route
- MODIFIED TOC/Index format → Task: Update CookbookStandaloneLayout

---

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: No crash on missing page map entry

- **Given** a recipe list where one recipe ID is not in the `buildPageMap()` result
- **When** the print view renders
- **Then** no JavaScript error is thrown and all other `#N` labels render correctly
