## ADDED Requirements

### Requirement: Site-wide footer renders on every route
The system SHALL render a `Footer` component on every route, in normal document flow after the
page's main content, containing a copyright line and links to the Terms of Service and Privacy
Policy pages.

#### Scenario: Footer visible on an arbitrary route
- **WHEN** a user navigates to any route in the app (e.g. `/recipes`, `/`, `/auth/login`)
- **THEN** the footer renders at the end of the page content, below `{children}`

#### Scenario: Footer links to Terms of Service
- **WHEN** the footer renders
- **THEN** it contains a link with visible text "Terms" (or equivalent) whose `to` target is
  `/terms`

#### Scenario: Footer links to Privacy Policy
- **WHEN** the footer renders
- **THEN** it contains a link with visible text "Privacy Policy" whose `to` target is
  `/privacy-policy`

#### Scenario: Footer shows a computed copyright year
- **WHEN** the footer renders
- **THEN** it displays a copyright line in the form "© {current year} My CookBooks", where the
  year is derived from the current date at render time (not a hardcoded literal)

#### Scenario: Footer items are separated by the app's inline-meta delimiter
- **WHEN** the footer renders the copyright line, Terms link, and Privacy Policy link together
- **THEN** each item is separated by the `·` (U+00B7) character, consistent with existing
  inline-meta separators elsewhere in the app

### Requirement: Footer is excluded from print output
The system SHALL hide the footer when the page is printed, so it never appears on printed
recipes or cookbook pages.

#### Scenario: Footer absent in print media
- **WHEN** a page is rendered under print media (e.g. `@media print` / Playwright
  `page.emulateMedia({ media: 'print' })`)
- **THEN** the footer is not visible (its root element carries the `print:hidden` utility class,
  matching the mechanism already used by `Header`)

### Requirement: Footer follows theme token conventions
The system SHALL style the footer exclusively with `--theme-*` CSS custom properties, with no
hard-coded color values, so it renders legibly across all four themes (`dark`, `dark-greens`,
`light-cool`, `light-warm`).

#### Scenario: Footer legible across all themes
- **WHEN** the active theme is set to `dark`, `dark-greens`, `light-cool`, or `light-warm`
- **THEN** the footer's text, links, and top border remain legible and use only theme-token-driven
  colors (e.g. `var(--theme-fg-subtle)`, `var(--theme-border)`, `var(--theme-accent)`)
