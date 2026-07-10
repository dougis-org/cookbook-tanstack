## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Standalone page background matches the print token family

The shared `CookbookStandalonePage` wrapper (used by both `/cookbooks/$id/toc`
and `/cookbooks/$id/print`) SHALL render its on-screen background using the
same always-light `--theme-print-*` token family already used by its
descendant text and border colors (`--theme-print-fg`,
`--theme-print-fg-muted`, `--theme-print-fg-subtle`, `--theme-print-border`),
regardless of the currently active site theme (`dark`, `dark-greens`,
`light-cool`, `light-warm`).

#### Scenario: TOC/print page background is light in the dark theme

- **Given** a user has the "Dark (blues)" theme active (`html.dark`)
- **When** the user views `/cookbooks/$id/toc` or `/cookbooks/$id/print` (including with `?displayonly=1`)
- **Then** the page container background renders as the fixed light `--theme-print-bg` value, not the theme's dark `--theme-bg` value
- **AND** recipe names, the cookbook title, and footer text remain visible against that background

#### Scenario: TOC/print page background is light in every supported theme

- **Given** a user has any of the four supported themes active (`dark`, `dark-greens`, `light-cool`, `light-warm`)
- **When** the user views `/cookbooks/$id/toc` or `/cookbooks/$id/print`
- **Then** the page container background renders identically as the fixed light `--theme-print-bg` value in all four cases

#### Scenario: Actual print output is unaffected

- **Given** a user triggers the browser print dialog from `/cookbooks/$id/print`
- **When** the document is printed
- **Then** the printed page background remains white, as already enforced by the existing `@media print` rule in `src/styles/print.css`, unchanged by this requirement

## Traceability

- Proposal element: "The on-screen background of `CookbookStandalonePage` matches the same always-light token family already used by its text/border content" -> Requirement: ADDED Standalone page background matches the print token family
- Design decision: Decision 1 (change `pageBaseClass` to use `--theme-print-bg`) -> Requirement: ADDED Standalone page background matches the print token family
- Requirement: ADDED Standalone page background matches the print token family -> Task(s): update `pageBaseClass`, update/add component and E2E tests covering all four themes

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: No regression to other consumers of `--theme-bg`

- **Given** the rest of the application relies on `--theme-bg` for theme-driven backgrounds outside of `CookbookStandalonePage`
- **When** this change is applied
- **Then** no other route or component's background changes, since the fix is scoped to the local `pageBaseClass` constant rather than the shared `--theme-bg` token definition
