## MODIFIED Requirements

### Requirement: MODIFIED Filter chips use theme tokens in all themes

The system SHALL render filter toggle chips (`FilterToggle` in `FilterRow1Quick`) and active filter badges (`ActiveBadge`) using `--theme-*` tokens for all colour properties, with no hardcoded dark-specific values.

#### Scenario: Inactive filter chip is readable in light-cool

- **Given** `html.light-cool` is active and no quick filter is selected
- **When** the inactive filter chip is rendered
- **Then** the chip border, background, and text colours are derived from `--theme-border`, `--theme-surface`, and `--theme-fg-muted` tokens
- **And** the chip is visually distinct from the page background

#### Scenario: Active filter chip uses accent colour in light-cool

- **Given** `html.light-cool` is active and a quick filter is selected
- **When** the active filter chip is rendered
- **Then** the chip uses `--theme-accent` for text and border, and an accent-tinted background
- **And** the text colour is `var(--theme-accent)` (`blue-600`) — not the dark-mode `cyan-300`

#### Scenario: Active badge (chiclet) uses accent colour in light-cool

- **Given** `html.light-cool` is active and an active filter badge is displayed
- **When** the `ActiveBadge` component renders
- **Then** the badge text and border use `--theme-accent` token values
- **And** the badge label is readable (contrast ≥ 4.5:1 against the badge background)

### Requirement: MODIFIED Modals and overlays use theme tokens for all surfaces

The system SHALL render `ConfirmDialog`, `DeleteConfirmModal`, and `ImportPreviewModal` using `--theme-surface-raised`, `--theme-fg`, `--theme-border`, and `--theme-shadow-md` tokens instead of hardcoded `bg-slate-800`/`text-white`.

#### Scenario: ConfirmDialog is readable in light-cool

- **Given** `html.light-cool` is active and a confirm dialog is triggered
- **When** the dialog renders
- **Then** the dialog panel uses `var(--theme-surface-raised)` background, `var(--theme-fg)` text, and `var(--theme-shadow-md)` for elevation
- **And** all text is readable against the dialog background

#### Scenario: DeleteConfirmModal is readable in light-cool

- **Given** `html.light-cool` is active and a delete confirmation is triggered
- **When** the modal renders
- **Then** the modal uses `var(--theme-surface-raised)` background and `var(--theme-fg)` for all non-status text
- **And** the destructive action button remains `bg-red-600` (semantic status colour, exempt from token migration)

#### Scenario: ImportPreviewModal is readable in light-cool

- **Given** `html.light-cool` is active and the import preview modal is shown
- **When** the modal renders
- **Then** the modal panel, title, and metadata text all use `--theme-*` tokens
- **And** no hardcoded `bg-slate-900`, `text-white`, or `text-gray-400` classes remain in the component

### Requirement: MODIFIED CookbookCard Private badge uses theme token

The system SHALL render the "Private" badge on `CookbookCard` using `var(--theme-surface-hover)` background and `var(--theme-fg-muted)` text instead of `bg-slate-700 text-gray-300`.

#### Scenario: Private badge is readable in light-cool

- **Given** `html.light-cool` is active and a private cookbook card is rendered
- **When** the Private badge is visible
- **Then** the badge uses token-driven colours appropriate to the light-cool palette

### Requirement: MODIFIED CookbookRecipeCard and CookbookFields use theme tokens

The system SHALL replace all hardcoded `text-gray-*` and `bg-gray-*` values in `CookbookRecipeCard` and `CookbookFields` with `--theme-fg-*` and `--theme-surface-*` tokens.

#### Scenario: Recipe list item numbering and metadata are readable in light-cool

- **Given** `html.light-cool` is active and a cookbook recipe list is rendered
- **When** the recipe number and metadata text are displayed
- **Then** the text colours are derived from `--theme-fg-muted` or `--theme-fg-subtle` tokens

### Requirement: MODIFIED Auth form link colours use theme accent token

The system SHALL render all hyperlinks and inline links in auth forms (`LoginForm`, `RegisterForm`, `ForgotPasswordForm`, `ResetPasswordForm`) using `var(--theme-accent)` and `var(--theme-accent-hover)` instead of hardcoded `text-cyan-400 hover:text-cyan-300`.

#### Scenario: Auth form links are readable in light-cool

- **Given** `html.light-cool` is active and a login form is displayed
- **When** the "Forgot password?" and "Create one" links are rendered
- **Then** the link text colour is `var(--theme-accent)` (`blue-600`)
- **And** the hover colour is `var(--theme-accent-hover)` (`blue-700`)
- **And** contrast against the form background is ≥ 4.5:1

### Requirement: MODIFIED RecipeDetail and RecipeForm CTA elements use theme tokens

The system SHALL replace hardcoded `bg-cyan-500 text-white` and `text-cyan-400` usages in `RecipeDetail` and `RecipeForm` (non-exempt) with token-based equivalents. The publish/save CTA button uses `var(--theme-accent)` background.

#### Scenario: Recipe save button uses accent colour in light-cool

- **Given** `html.light-cool` is active and the recipe form is rendered
- **When** the save/publish CTA button is visible
- **Then** the button background is `var(--theme-accent)` (`blue-600`)
- **And** the button text is white (acceptable — white on blue-600 passes contrast at ~5.9:1)

### Requirement: MODIFIED ImportDropzone uses theme tokens

The system SHALL replace `border-slate-600`, `text-white`, and `text-gray-400` in `ImportDropzone` with `--theme-border`, `--theme-fg`, and `--theme-fg-muted` tokens.

#### Scenario: Dropzone is readable in light-cool

- **Given** `html.light-cool` is active and the import dropzone is rendered
- **When** the dropzone is in its idle state
- **Then** the dashed border uses `var(--theme-border)`, the heading uses `var(--theme-fg)`, and the description uses `var(--theme-fg-muted)`

### Requirement: MODIFIED Header sign-in button uses accessible text

The system SHALL replace the hardcoded `text-white` on the Header sign-in button with a value that is readable in both dark and light-cool themes.

#### Scenario: Sign-in button text is readable in light-cool

- **Given** `html.light-cool` is active and the header is rendered
- **When** the sign-in button is displayed (using `bg-[var(--theme-accent)]`)
- **Then** the button text is white (hardcoded `text-white` is acceptable here — white on blue-600 passes contrast)

### Requirement: MODIFIED Home page hero text uses theme tokens

The system SHALL remove the hardcoded `text-white` from the home page hero `<h1>` and use `var(--theme-fg)` as fallback text, with the gradient applied via clip where supported.

#### Scenario: Hero title is visible in light-cool

- **Given** `html.light-cool` is active and the home page is loaded
- **When** the "CookBook" hero title is rendered
- **Then** the text is visible — either as a gradient using `--theme-accent` range colours, or as `var(--theme-fg)` fallback
- **And** the title is not invisible (no `text-white` on a white background)

## REMOVED Requirements

### Requirement: REMOVED Hardcoded dark colours in non-exempt component files

Reason for removal: All hardcoded `slate-*`, `gray-*`, `text-white`, `text-cyan-300/400`, and `bg-cyan-*` values in non-exempt component classNames are removed and replaced with CSS custom property token references.

**Exempt files (dark: variants intentionally retained):**
- `src/components/ui/TaxonomyBadge.tsx` — categorical badge colours
- `src/components/ui/ClassificationBadge.tsx` — categorical badge colours
- `src/components/ui/MultiSelectDropdown.tsx` — checked item cyan tint (documented, no token equivalent)
- `src/components/recipes/RecipeForm.tsx` draft banner — `dark:text-cyan-300` (documented carve-out from #281)
- `src/components/recipes/StatusIndicator.tsx` — `green-*` and `red-*` are semantic status colours, exempt

## Traceability

- Proposal element (component migration) → Requirements: all MODIFIED requirements above
- Design decision 8 (migration scope + exempt carve-outs) → Requirements: REMOVED hardcoded colours, exempt list
- Design decision 6 (theme-specific accent) → Requirements: auth links, filter chips, CTA buttons use `--theme-accent`
- Design decision 4 (shadow tokens) → Requirements: modals use `--theme-shadow-md`
- Requirements → Tasks: T7 (filter components), T8 (modals/overlays), T9 (cookbook components), T10 (auth forms), T11 (recipe components), T12 (home page + header), T13 (shadow adoption)

## Non-Functional Acceptance Criteria

### Requirement: Reliability — zero hardcoded dark colours in non-exempt files after migration

#### Scenario: Post-migration grep finds no unexpected hardcoded dark colours

- **Given** the component migration is complete
- **When** a grep is run for `\bslate-[0-9]\|bg-gray-[0-9]\|text-white\b\|text-cyan-[123]\b` across `src/components` and `src/routes`
- **Then** the only matches are in the explicitly exempt files listed above and in test files

### Requirement: Accessibility — all interactive elements meet contrast in light-cool

#### Scenario: Filter chip, modal, and auth form text pass WCAG AA in light-cool E2E

- **Given** `html.light-cool` is active
- **When** the recipes page (with filter chips), a confirm dialog, and the login form are each rendered
- **Then** all visible text elements pass a computed contrast ratio check of ≥ 4.5:1 against their local background

### Requirement: Reliability — dark theme unaffected by component migration

#### Scenario: Component migration does not regress dark theme rendering

- **Given** the component migration is complete and dark theme is active
- **When** the full E2E suite runs
- **Then** all previously passing dark theme tests continue to pass without modification

---

## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED base.css imported before theme files

The system SHALL import `src/styles/base.css` in the main stylesheet entry point before any theme file imports, so that `:root` defaults are defined at lower specificity than theme overrides.

#### Scenario: base.css precedes theme imports

- **Given** `src/styles.css` (or equivalent entry point) is inspected
- **When** the import order is checked
- **Then** `base.css` appears before `themes/dark.css`, `themes/light-cool.css`, and `themes/light-warm.css`

#### Scenario: Theme override wins over base default

- **Given** `html.dark` is active and `dark.css` overrides `--theme-error-base`
- **When** `--theme-error-base` is resolved via `getComputedStyle`
- **Then** the dark theme's value takes precedence over the `:root` value from `base.css`

## MODIFIED Requirements

### Requirement: MODIFIED No hardcoded Tailwind color classes remain in migrated component files

The system SHALL have zero occurrences of raw Tailwind color scale classes matching the pattern `(text|bg|border)-(red|blue|cyan|amber|orange|green|gray|slate|zinc|neutral|stone|violet|emerald|indigo|purple|pink|rose)-[0-9]+` in the 26 affected files listed in issue #316, with the exception of `CookbookStandaloneLayout` which uses `--theme-print-*` tokens (addressed in print-tokens.md) and any files determined to have legitimately intentional hardcoded colors documented with an inline comment.

#### Scenario: grep finds no hardcoded classes in migrated files

- **Given** all 26 component/route files have been migrated
- **When** a CI grep runs the pattern from issue #316 against `src/`
- **Then** the exit code is non-zero (no matches) OR all remaining matches are annotated with `/* theme-intentional */` comments

#### Scenario: Gray/slate utility classes replaced by structural tokens

- **Given** a component previously used `text-gray-400` (15 occurrences project-wide)
- **When** the component is migrated
- **Then** `text-gray-400` is replaced with `text-[var(--theme-fg-subtle)]` or equivalent structural token; no manual `dark:` variant is needed

### Requirement: MODIFIED Components render correctly in all three themes after migration

The system SHALL produce no visual regressions across dark, light-cool, and light-warm themes for all migrated components.

#### Scenario: Dark theme renders identically before and after migration

- **Given** a Playwright screenshot baseline exists for dark theme
- **When** the migrated components are rendered in dark theme
- **Then** the screenshot matches the baseline within an acceptable pixel diff threshold

#### Scenario: Light-cool theme status colors are legible

- **Given** `html.light-cool` is active
- **When** a form renders with a validation error (using `--theme-error` and `--theme-error-bg`)
- **Then** the error text has a contrast ratio ≥ 4.5:1 against the surface background

## REMOVED Requirements

### Requirement: REMOVED Manual `dark:` variant classes on status and badge colors

Reason for removal: Theme-specific color values for status states and badges move entirely into `dark.css` token overrides. Components no longer need `dark:text-red-400`, `dark:bg-amber-500/20`, or similar — the token cascade handles theme differentiation.

## Traceability

- Proposal element "26 component files with hardcoded color classes" → Requirement: MODIFIED No hardcoded classes remain
- Design decision 5 (Tailwind arbitrary values) → Requirement: MODIFIED No hardcoded classes remain
- Design decision 1 (base.css `:root` cascade) → Requirement: ADDED base.css imported before theme files
- Requirement: ADDED base.css import order → Tasks: "Update src/styles.css import order"
- Requirement: MODIFIED No hardcoded classes → Tasks: per-file migration tasks in tasks.md
- Requirement: MODIFIED Components render correctly → Tasks: "Visual regression check", "E2E screenshot tests"

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: No JS bundle size increase

- **Given** the migration adds only CSS files and removes hardcoded Tailwind classes
- **When** the production build is analyzed
- **Then** the JS bundle size is unchanged (CSS changes only affect the CSS bundle, which may slightly decrease due to removed inline `dark:` variants)

### Requirement: Reliability

#### Scenario: Hardcoded color grep enforced in CI

- **Given** the CI pipeline runs after this change merges
- **When** a future PR introduces a hardcoded color class in a migrated file
- **Then** the grep check fails and blocks the PR from merging

### Requirement: Security

No security-relevant changes. This is a pure CSS token refactor with no authentication, authorization, or data handling impact.
