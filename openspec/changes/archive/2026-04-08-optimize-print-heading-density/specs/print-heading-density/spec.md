## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED print-facing headings use shared density tiers

The system SHALL apply a shared print-heading density pattern to print-facing recipe and cookbook components so that printed output uses less vertical space while preserving readable hierarchy.

#### Scenario: Recipe section headings use the shared print section tier

- **Given** a recipe detail surface is rendered in a print-facing context
- **When** the user opens print preview or prints the page
- **Then** existing recipe section headings such as Ingredients, Instructions, and Nutrition use the shared print section-heading density treatment
- **And** the treatment reduces print-only size and spacing compared with the default screen styling

#### Scenario: Cookbook print headings use level-appropriate shared tiers

- **Given** a cookbook print view renders a cookbook title, chapter headings, or alphabetical index heading
- **When** the user opens print preview or prints the page
- **Then** those headings use the shared print-heading pattern with level-appropriate density tiers
- **And** major headings remain visually distinct from subordinate headings in print

### Requirement: ADDED print heading density remains print-only

The system SHALL scope heading density changes to print behavior and SHALL NOT alter screen typography or introduce new content sections.

#### Scenario: Screen layout remains unchanged

- **Given** a user views the recipe or cookbook pages on screen without printing
- **When** the print-heading density change is present in the codebase
- **Then** the existing non-print heading sizes and spacing remain unchanged

#### Scenario: Notes content remains unlabeled body copy

- **Given** a recipe includes notes content
- **When** the recipe is rendered for screen or print
- **Then** the notes content remains body text rather than a newly introduced Notes heading

## MODIFIED Requirements

### Requirement: MODIFIED cookbook print surfaces favor page-efficient heading rhythm

The system SHALL render print-facing cookbook and recipe headings with a denser vertical rhythm than the current screen-oriented defaults, while avoiding cramped printed output.

#### Scenario: Printed document fits headings more efficiently

- **Given** a cookbook print route includes a table of contents, recipe sections, and an alphabetical index
- **When** the document is printed
- **Then** the heading spacing in those print-facing surfaces is tighter than the prior screen-derived styling
- **And** the printed hierarchy remains easy to scan

#### Scenario: Density changes do not require global heading resets

- **Given** unrelated application pages also render heading elements
- **When** the print-heading density change is implemented
- **Then** those unrelated pages are not affected through a global `h1`-`h6` print reset

## REMOVED Requirements

### Requirement: REMOVED print-facing headings inherit unmodified screen spacing

Reason for removal: Print-facing headings should no longer rely on unmodified screen-first spacing and sizing because that wastes page space in printed output.

## Traceability

- Proposal element -> Requirement:
  - Shared print-heading density approach -> `ADDED print-facing headings use shared density tiers`
  - Keep changes print-only and avoid new sections -> `ADDED print heading density remains print-only`
  - Improve page-space efficiency without feeling cramped -> `MODIFIED cookbook print surfaces favor page-efficient heading rhythm`
- Design decision -> Requirement:
  - Decision 1 -> `ADDED print-facing headings use shared density tiers`
  - Decision 2 -> `ADDED print-facing headings use shared density tiers`, `MODIFIED cookbook print surfaces favor page-efficient heading rhythm`
  - Decision 3 -> `MODIFIED cookbook print surfaces favor page-efficient heading rhythm`
  - Decision 4 -> all requirements in this spec via class-based verification
- Requirement -> Task(s):
  - `ADDED print-facing headings use shared density tiers` -> Task 2, Task 3, Task 4
  - `ADDED print heading density remains print-only` -> Task 2, Task 3, Task 4
  - `MODIFIED cookbook print surfaces favor page-efficient heading rhythm` -> Task 2, Task 3, Task 5

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: No additional print data work is introduced

- **Given** the print-facing recipe and cookbook pages render as they do today
- **When** the heading density change is implemented
- **Then** no additional network requests, data fetches, or pagination computations are introduced solely for heading styling

### Requirement: Security

#### Scenario: Styling-only change does not expand access or input surface

- **Given** the print-heading density change is present
- **When** a user loads a print-facing route
- **Then** the change introduces no new user input handling, access control paths, or external dependencies

### Requirement: Reliability

#### Scenario: Print heading contracts are regression-tested

- **Given** the print-heading density implementation is complete
- **When** automated tests run
- **Then** tests verify the intended print-heading classes or hooks on targeted recipe and cookbook heading elements
- **And** regressions to those print hooks cause test failures
