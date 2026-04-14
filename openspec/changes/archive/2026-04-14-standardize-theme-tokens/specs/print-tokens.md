## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED `--theme-print-*` namespace with hardcoded light defaults

The system SHALL define the following tokens in `src/styles/base.css` `:root` with explicit light values independent of any active theme class:
- `--theme-print-bg` — always white
- `--theme-print-surface` — always white
- `--theme-print-fg` — always dark (e.g. `gray-900`)
- `--theme-print-fg-muted` — medium gray (e.g. `gray-600`)
- `--theme-print-fg-subtle` — light gray (e.g. `gray-500`)
- `--theme-print-border` — pale border (e.g. `gray-200`)
- `--theme-print-accent` — dark heading color (e.g. `gray-900`) used for section titles

These tokens SHALL NOT inherit from structural `--theme-*` tokens so that dark-theme values never bleed into print output.

#### Scenario: Print tokens resolve to light values in dark theme

- **Given** `html.dark` is active
- **When** `--theme-print-fg` is inspected via `getComputedStyle`
- **Then** it resolves to the `:root` default (`gray-900`), not the dark theme's `--theme-fg` (`white`)

#### Scenario: Print tokens are consumed by CookbookStandaloneLayout

- **Given** any active theme
- **When** `CookbookStandaloneLayout` renders
- **Then** all text, border, and background colors are drawn from `--theme-print-*` tokens and the layout appears light regardless of active theme

### Requirement: ADDED `@media print` overrides for ink-saving

The system SHALL add a `@media print` block to `src/styles/print.css` that overrides specific `--theme-print-*` tokens for ink-saving rendering: slightly darker `--theme-print-fg-muted` and `--theme-print-border` for better contrast when ink is limited.

#### Scenario: Print media query adjusts border weight

- **Given** the browser print dialog is invoked
- **When** `--theme-print-border` is inspected inside `@media print`
- **Then** it resolves to a slightly darker value than the screen default (e.g. `gray-300` vs `gray-200`)

### Requirement: ADDED `[data-pdf-export]` override block for PDF export

The system SHALL define a `[data-pdf-export]` block in `src/styles/base.css` that overrides `--theme-print-accent` with a branded color (e.g. `cyan-700`) for use when a PDF renderer applies `data-pdf-export` to `<html>`.

#### Scenario: PDF export accent color differs from default print

- **Given** `data-pdf-export` attribute is set on `<html>`
- **When** `--theme-print-accent` is inspected
- **Then** it resolves to the PDF-specific branded color, not the default gray heading color

#### Scenario: PDF export attribute does not affect UI theme tokens

- **Given** `data-pdf-export` attribute is set on `<html>`
- **When** `--theme-fg` (a structural UI token) is inspected
- **Then** it resolves to the active theme's value, unaffected by the PDF export attribute

## MODIFIED Requirements

### Requirement: MODIFIED CookbookStandaloneLayout uses print tokens throughout

Previously, `CookbookStandaloneLayout` used hardcoded `text-gray-900`, `border-gray-200`, etc. The system SHALL migrate all color classes in `src/components/cookbooks/CookbookStandaloneLayout.tsx` to `--theme-print-*` token utilities.

#### Scenario: Dark theme does not bleed into cookbook print view

- **Given** `html.dark` is active
- **When** a Playwright screenshot is taken of `CookbookStandaloneLayout`
- **Then** no dark background, dark text, or dark border colors appear — the layout renders entirely in the light print palette

#### Scenario: Printed cookbook is unaffected by theme switching

- **Given** the user switches between themes
- **When** `@media print` stylesheet is applied (or browser print dialog opened)
- **Then** the printed output is identical regardless of which UI theme was active

## REMOVED Requirements

### Requirement: REMOVED Hardcoded light-mode colors in CookbookStandaloneLayout

Reason for removal: Hardcoded `text-gray-900`, `border-gray-200`, `text-gray-500`, etc. are replaced by `--theme-print-*` token utilities. The print layout's light-mode appearance is now governed entirely by the print token namespace.

## Traceability

- Proposal element "CookbookStandaloneLayout print migration" → Requirement: MODIFIED CookbookStandaloneLayout uses print tokens
- Proposal element "PDF export foundation" → Requirement: ADDED `[data-pdf-export]` override block
- Design decision 4 (`--theme-print-*` namespace) → all requirements in this spec
- Requirement: ADDED `--theme-print-*` namespace → Tasks: "Add print tokens to base.css"
- Requirement: ADDED `@media print` overrides → Tasks: "Add print media query overrides to print.css"
- Requirement: ADDED `[data-pdf-export]` block → Tasks: "Add pdf-export override block to base.css"
- Requirement: MODIFIED CookbookStandaloneLayout → Tasks: "Migrate CookbookStandaloneLayout to print tokens"

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Print view renders correctly regardless of active theme

- **Given** each of the three themes is active in sequence
- **When** Playwright renders `CookbookStandaloneLayout` and takes a screenshot
- **Then** all three screenshots are visually identical (light layout throughout)

### Requirement: Operability

#### Scenario: PDF renderer can override accent with one attribute

- **Given** a future PDF export feature applies `data-pdf-export` to `<html>` before screenshot
- **When** the PDF is generated
- **Then** section headings render in the branded accent color with no additional CSS or component changes required
