## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Print output is unaffected by Light (warm) theme

The system SHALL override warm background tokens to white within the PrintLayout wrapper, ensuring print output is identical regardless of the active theme.

#### Scenario: PrintLayout renders white background under Light (warm)

- **Given** the user has Light (warm) set as their active theme
- **When** the user navigates to a cookbook print route (e.g. `/cookbooks/:id/print`)
- **Then** the PrintLayout wrapper's inline `--theme-bg` style value is `white`
- **And** the visible print area background is white, not amber

## MODIFIED Requirements

No print requirements are modified (PrintLayout inline override is theme-agnostic and covers all themes including the new one).

## REMOVED Requirements

No requirements are removed.

## Traceability

- Proposal element (print isolation unaffected) → Requirement: PrintLayout renders white under Light (warm) → Task: No implementation needed (existing PrintLayout handles this)
- Design decision (PrintLayout inline override is generic) → Requirement → Verified by existing `print isolation` E2E test

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Print isolation holds regardless of theme stored in localStorage

- **Given** any theme (including `light-warm`) is stored in localStorage
- **When** the print route is loaded
- **Then** the PrintLayout `--theme-bg` token is always overridden to `white` inline
- **And** no warm tint bleeds into printed output
