## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED No flash of unstyled content on dark-greens load

The system SHALL render the correct `dark-greens` background colour before any JavaScript or CSS bundle loads.

#### Scenario: Correct background on first paint

- **Given** `localStorage` contains `'dark-greens'`
- **When** the browser parses and renders `<head>` (before JS executes)
- **Then** `<html>` background colour is `#103c48`
- **And** `<html>` text colour is `#adbcbc`
- **And** no white or blue flash is visible between server HTML and first paint

#### Scenario: criticalCss covers dark-greens

- **Given** the page HTML is inspected before any stylesheet loads
- **When** the inline `<style data-id="critical-theme">` tag is evaluated
- **Then** it contains `html.dark-greens{background:#103c48;color:#adbcbc}`

## MODIFIED Requirements

### Requirement: MODIFIED criticalCss covers all four themes

The system SHALL include inline background/foreground values for all four registered themes.

#### Scenario: All four theme backgrounds present in criticalCss

- **Given** the rendered HTML `<head>` section
- **When** the `<style data-id="critical-theme">` tag is read
- **Then** it contains rules for `html` (dark/blues default), `html.light-cool`, `html.light-warm`, and `html.dark-greens`

## REMOVED Requirements

No requirements removed by this change.

## Traceability

- Proposal element "Zero FOUC on dark-greens load" → Requirement: ADDED No flash of unstyled content
- Design Decision 5 (criticalCss inline style) → Both requirements above
- Requirements → Tasks: update `criticalCss` string in `__root.tsx`; E2E FOUC spec assertion for `dark-greens`

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: criticalCss adds negligible byte overhead

- **Given** the inline `<style>` tag in `<head>`
- **When** the page HTML is delivered
- **Then** the addition of the `dark-greens` rule adds fewer than 60 bytes to the inline style block
