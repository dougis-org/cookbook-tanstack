## MODIFIED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement. It modifies one requirement from the archived `print-instruction-numbering` capability
(`openspec/specs/print-instruction-numbering/spec.md`, originally from
`openspec/changes/archive/2026-07-06-remove-print-instruction-numbering/`).

### Requirement: MODIFIED Print output renders instruction step text left-aligned after a small delimiter marker

The system SHALL render each instruction step's text starting immediately after a small print-only delimiter marker (shared with the ingredient list via `.print-list-item`, see the `print-list-item-marker` capability), with the marker and text together reading as left-aligned against the instructions block's left edge. This supersedes the prior requirement that text render fully flush left with "no residual indent or gap" — that requirement predates the decision to add an intentional, minimal delimiter marker requested in #595.

#### Scenario: Instruction text sits left-aligned with a marker prefix in print

- **Given** a recipe detail page with instruction steps is rendered
- **When** the user opens print preview or prints the page
- **Then** each instruction step displays a small marker followed immediately by its step text, both starting at the left edge of the instructions content area
- **And** the gap between the marker and the text is limited to the shared `.print-list-item` spacing (no larger than the ingredient list's equivalent gap)

#### Scenario: No numbered badge gap remains

- **Given** a recipe detail page with instruction steps is rendered
- **When** the user opens print preview or prints the page
- **Then** there is no leftover horizontal gap sized for the original numbered circle badge — only the new, smaller `.print-list-item` marker gap is present

## Traceability

- Proposal element: "Add a matching small dot marker to instruction steps in print (#595)" -> Requirement: "MODIFIED Print output renders instruction step text left-aligned after a small delimiter marker"
- Design decision 1 (`.print-list-item::before` shared marker reused on `.recipe-instruction-step`) -> Requirement: "MODIFIED Print output renders instruction step text left-aligned after a small delimiter marker"
- Requirement -> Task(s): see [`tasks.md`](../../tasks.md)

## Non-Functional Acceptance Criteria

No new non-functional criteria beyond those already stated in the `print-list-item-marker` capability delta (Operability: single shared class; Reliability: pagination unaffected). The prior capability's Operability requirement ("Print styling follows the existing inline convention... no new print stylesheet, `@media print` CSS block... is introduced") is addressed by design.md's Context note: this change adds new selectors to the single pre-existing `@media print` block in `src/styles/print.css` rather than introducing a second block or file.
