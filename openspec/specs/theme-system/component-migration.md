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
