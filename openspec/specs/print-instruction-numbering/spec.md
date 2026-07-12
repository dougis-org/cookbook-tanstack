## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-07-06-remove-print-instruction-numbering/design.md) document, not a replacement.

### Requirement: ADDED Print output hides the instruction step number badge

The system SHALL hide the numbered circle badge on recipe instruction steps when the recipe detail page is rendered in a print-facing context (print preview or printed page), while leaving the badge visible and unchanged on screen.

#### Scenario: Instruction badge is hidden in print preview

- **Given** a recipe detail page with two or more instruction steps is rendered
- **When** the user opens print preview or prints the page
- **Then** the numbered circle badge that normally precedes each instruction step is not rendered
- **And** no other instruction content (step text) is hidden or altered

#### Scenario: Instruction badge remains visible on screen

- **Given** a recipe detail page with two or more instruction steps is rendered in a normal (non-print) browser view
- **When** the page is viewed on screen
- **Then** each instruction step still displays its numbered circle badge exactly as before this change
- **And** screen spacing and layout of the instructions list are unchanged

### Requirement: MODIFIED Print output renders instruction step text left-aligned after a small delimiter marker

The system SHALL render each instruction step's text starting immediately after a small print-only delimiter marker (shared with the ingredient list via `.print-list-item`, see the `print-list-item-marker` capability), with the marker and text together reading as left-aligned against the instructions block's left edge. This supersedes the prior requirement that text render fully flush left with "no residual indent or gap" — that requirement predates the decision to add an intentional, minimal delimiter marker requested in #595 (see [`unify-print-list-item-styling`](../../changes/archive/2026-07-12-unify-print-list-item-styling/proposal.md)).

#### Scenario: Instruction text sits left-aligned with a marker prefix in print

- **Given** a recipe detail page with instruction steps is rendered
- **When** the user opens print preview or prints the page
- **Then** each instruction step displays a small marker followed immediately by its step text, both starting at the left edge of the instructions content area
- **And** the gap between the marker and the text is limited to the shared `.print-list-item` spacing (no larger than the ingredient list's equivalent gap)

#### Scenario: No numbered badge gap remains

- **Given** a recipe detail page with instruction steps is rendered
- **When** the user opens print preview or prints the page
- **Then** there is no leftover horizontal gap sized for the original numbered circle badge — only the new, smaller `.print-list-item` marker gap is present

### Requirement: ADDED Print output uses reduced vertical spacing between instruction steps

The system SHALL reduce the vertical spacing between instruction steps when printed, relative to the spacing used on screen, so printed recipes use less vertical space per the reporter's request.

#### Scenario: Instruction steps are more vertically compact in print

- **Given** a recipe detail page with three or more instruction steps is rendered
- **When** the user opens print preview or prints the page
- **Then** the vertical space between consecutive instruction steps is visibly reduced compared with the screen rendering
- **And** the reduced spacing is comparable in density to the existing print spacing already used for the ingredients list on the same page

#### Scenario: Spacer rows between instruction steps are unaffected

- **Given** a recipe's instructions include one or more blank-line spacer rows between steps
- **When** the user opens print preview or prints the page
- **Then** the spacer rows continue to render as blank vertical space exactly as before this change
- **And** the spacer rows are not given a number badge or otherwise altered by this change

## Traceability

- Proposal element: "Add `print:hidden` ... to the numbered circle badge" -> Requirement: "ADDED Print output hides the instruction step number badge"
- Proposal element: "Adjust the `<li>` row's flex layout for print" -> Requirement: "MODIFIED Print output renders instruction step text left-aligned after a small delimiter marker"
- Proposal element: "Reduce vertical spacing between instruction steps for print" -> Requirement: "ADDED Print output uses reduced vertical spacing between instruction steps"
- Proposal element: "Must not change the web/screen rendering of instructions at all" -> Requirement: "ADDED Print output hides the instruction step number badge" (Scenario: Instruction badge remains visible on screen)
- Design decision 1 (`print:hidden` on badge) -> Requirement: "ADDED Print output hides the instruction step number badge"
- Design decision 2 (`print:block` on `<li>`, remove print-time padding) -> Requirement: "MODIFIED Print output renders instruction step text left-aligned after a small delimiter marker" (superseded by [`unify-print-list-item-styling`](../../changes/archive/2026-07-12-unify-print-list-item-styling/design.md) Decision 1, which reintroduces `display: flex` on the shared `.print-list-item` class so the marker and text render on one line)
- Design decision 3 (`print:space-y-1` on `<ol>`) -> Requirement: "ADDED Print output uses reduced vertical spacing between instruction steps"
- Requirement -> Task(s): see [`tasks.md`](../../changes/archive/2026-07-06-remove-print-instruction-numbering/tasks.md) (implementation task updating `RecipeDetail.tsx` instruction markup; verification task covering print preview and existing tests)

## Non-Functional Acceptance Criteria

> NFAC scenarios below do not duplicate the functional scenarios above; they only cover distinct non-functional properties (maintainability of the print-styling convention, and reliability of the unaffected spacer path already covered functionally above via cross-reference).

### Requirement: Operability

#### Scenario: Print styling follows the existing inline convention

- **Given** the change is implemented in `src/components/recipes/RecipeDetail.tsx`
- **When** the diff is reviewed
- **Then** all instruction print-density changes are expressed as Tailwind `print:` utility classes applied directly in JSX, consistent with existing patterns in the same file (e.g. `print:mb-4`, `print:columns-2 print:gap-x-8 print:space-y-1`, `PRINT_HEADING_DENSITY_SECTION`)
- **And** no new print stylesheet or JS-based print-mode detection is introduced

> Note: [`unify-print-list-item-styling`](../../changes/archive/2026-07-12-unify-print-list-item-styling/design.md) adds the shared `.print-list-item` marker rule as new selectors inside `src/styles/print.css`'s single, pre-existing `@media print { }` block (in place since before this capability existed), rather than a second block or a new file — so this scenario's "no new stylesheet/block" intent still holds even though the delimiter marker itself is no longer purely Tailwind-utility-driven.

### Requirement: Reliability

#### Scenario: Spacer rows unaffected

- See functional scenario: "Spacer rows between instruction steps are unaffected"
