## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Dark (greens) theme option in picker

The system SHALL present `Dark (greens)` as a selectable theme in the theme picker.

#### Scenario: Four themes visible in picker

- **Given** the user opens the theme picker in the header
- **When** the picker renders
- **Then** it shows exactly four options: `Dark (blues)`, `Dark (greens)`, `Light (cool)`, `Light (warm)`

#### Scenario: Selecting Dark (greens) applies Selenized colours

- **Given** the user is on any page with default or a different theme active
- **When** the user selects `Dark (greens)` from the theme picker
- **Then** `<html>` has class `dark-greens`
- **And** the page background colour matches `#103c48`
- **And** the accent colour (links, buttons) matches `#75b938`

#### Scenario: Selecting Dark (greens) with invalid stored value

- **Given** localStorage contains an unrecognised theme ID (e.g. `corrupted`)
- **When** the page loads
- **Then** the theme falls back to `dark` (Dark (blues))
- **And** no console error is thrown

### Requirement: ADDED Dark (greens) badge colours

The system SHALL render taxonomy badges with the Selenized-mapped palette when `dark-greens` is active.

#### Scenario: Badge colours on dark-greens theme

- **Given** the `dark-greens` theme is active
- **When** a recipe card with meal, course, prep, and classification badges is displayed
- **Then** meal badge uses yellow `#dbb32d`
- **And** course badge uses violet `#af88eb`
- **And** prep badge uses orange `#ed8649`
- **And** classification badge uses cyan `#41c7b9`

## MODIFIED Requirements

### Requirement: MODIFIED Dark theme label in picker

The system SHALL display `Dark (blues)` as the label for the existing `dark` theme (previously labelled `Dark`).

#### Scenario: Existing dark theme label updated

- **Given** the user opens the theme picker
- **When** the picker renders
- **Then** the option with `id: 'dark'` shows label `Dark (blues)`
- **And** the option is still selectable and applies the existing blue/cyan theme

#### Scenario: Stored dark theme continues working

- **Given** a user has `'dark'` stored in localStorage from before this change
- **When** the page loads
- **Then** the `Dark (blues)` theme is applied (class `dark` on `<html>`)
- **And** the stored value is not modified

## REMOVED Requirements

No requirements removed by this change.

## Traceability

- Proposal element "New dark-greens theme" → Requirement: ADDED Dark (greens) theme option in picker
- Proposal element "Rename dark label to Dark (blues)" → Requirement: MODIFIED Dark theme label in picker
- Design Decision 3 (token values) → Requirement: ADDED Dark (greens) theme option in picker
- Design Decision 4 (badge palette) → Requirement: ADDED Dark (greens) badge colours
- Design Decision 1 (keep dark ID) → Requirement: MODIFIED Dark theme label in picker
- Requirements → Tasks: theme-picker unit tests, E2E theme switching, badge visual QC

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Theme selector renders with four items on mobile viewport

- **Given** viewport width is 375px (mobile)
- **When** the theme picker is opened
- **Then** all four theme options are visible without horizontal scroll or overflow clipping
