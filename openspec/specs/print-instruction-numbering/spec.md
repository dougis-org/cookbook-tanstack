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

### Requirement: ADDED Print output renders instruction step text flush left

The system SHALL render each instruction step's text starting at the left edge of the instructions block when printed, with no residual indent or gap left by the hidden number badge.

#### Scenario: Instruction text sits flush left after badge is hidden

- **Given** a recipe detail page with instruction steps is rendered
- **When** the user opens print preview or prints the page
- **Then** each instruction step's paragraph text begins at the left edge of the instructions content area
- **And** there is no empty horizontal gap where the number badge previously sat

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
- Proposal element: "Adjust the `<li>` row's flex layout for print" -> Requirement: "ADDED Print output renders instruction step text flush left"
- Proposal element: "Reduce vertical spacing between instruction steps for print" -> Requirement: "ADDED Print output uses reduced vertical spacing between instruction steps"
- Proposal element: "Must not change the web/screen rendering of instructions at all" -> Requirement: "ADDED Print output hides the instruction step number badge" (Scenario: Instruction badge remains visible on screen)
- Design decision 1 (`print:hidden` on badge) -> Requirement: "ADDED Print output hides the instruction step number badge"
- Design decision 2 (`print:block` on `<li>`, remove print-time padding) -> Requirement: "ADDED Print output renders instruction step text flush left"
- Design decision 3 (`print:space-y-1` on `<ol>`) -> Requirement: "ADDED Print output uses reduced vertical spacing between instruction steps"
- Requirement -> Task(s): see [`tasks.md`](../../changes/archive/2026-07-06-remove-print-instruction-numbering/tasks.md) (implementation task updating `RecipeDetail.tsx` instruction markup; verification task covering print preview and existing tests)

## Non-Functional Acceptance Criteria

> NFAC scenarios below do not duplicate the functional scenarios above; they only cover distinct non-functional properties (maintainability of the print-styling convention, and reliability of the unaffected spacer path already covered functionally above via cross-reference).

### Requirement: Operability

#### Scenario: Print styling follows the existing inline convention

- **Given** the change is implemented in `src/components/recipes/RecipeDetail.tsx`
- **When** the diff is reviewed
- **Then** all instruction print-density changes are expressed as Tailwind `print:` utility classes applied directly in JSX, consistent with existing patterns in the same file (e.g. `print:mb-4`, `print:columns-2 print:gap-x-8 print:space-y-1`, `PRINT_HEADING_DENSITY_SECTION`)
- **And** no new print stylesheet, `@media print` CSS block, or JS-based print-mode detection is introduced

### Requirement: Reliability

#### Scenario: Spacer rows unaffected

- See functional scenario: "Spacer rows between instruction steps are unaffected"
