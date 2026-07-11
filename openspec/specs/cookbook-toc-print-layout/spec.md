### Requirement: TOC layout is implemented by a shared component used by both the standalone TOC and the full-print routes

The system SHALL implement the TOC recipe list rendering in a single shared
`CookbookTocList` component, used by both the standalone TOC page
(`/cookbooks/$id/toc`) and the full cookbook print page
(`/cookbooks/$id/print`), so that both routes produce identical TOC output when
printed. `CookbookTocList` SHALL derive display order with the shared cookbook
page-order utility, call `buildPageMap()` with that display-ordered list, and
pass the resulting position number to each `RecipePageRow` as a `pageNumber`
prop. On screens at the `sm` breakpoint (≥ 640px) and above,
`CookbookTocList` SHALL render its recipe list in two columns. On screens
narrower than `sm`, it SHALL render in a single column. Printed output SHALL
always render in two columns regardless of screen width.

#### Scenario: Standalone TOC and full-print TOC are visually identical when printed

- **WHEN** the standalone TOC page and the full-print page are both printed for the same cookbook
- **THEN** the TOC sections are visually identical: same column layout, same
  chapter grouping, same numbering, same entry format, same page numbers

#### Scenario: CookbookTocList is the sole location for TOC print CSS

- **WHEN** a developer inspects the TOC print styling
- **THEN** the 2-column, break-inside-avoid, and chapter-break-after-avoid
  classes exist only in `CookbookTocList` (not duplicated in route files)

#### Scenario: TOC renders in 2 columns on screens at sm breakpoint and above

- **WHEN** a user views the TOC page in a browser on a screen ≥ 640px wide
- **THEN** the recipe list is rendered in two columns

#### Scenario: TOC renders in 1 column on mobile screens

- **WHEN** a user views the TOC page on a screen narrower than 640px
- **THEN** the recipe list is rendered in a single column

### Requirement: TOC entry displays cookbook position reference

The system SHALL render each TOC entry as: index number, recipe name, and the
cookbook position reference, in that order. The position reference SHALL use
`#N` format, SHALL be right-aligned, and SHALL be de-emphasized on screen.

#### Scenario: TOC entry shows position reference in screen view

- **WHEN** a user views the TOC page in a browser
- **THEN** each recipe entry shows a position reference (e.g. `#5`) to the
  right, styled with low contrast (`text-gray-500`) so it is de-emphasized
  relative to the recipe name

#### Scenario: TOC entry shows position reference in print

- **WHEN** the TOC page is printed or shown in print preview
- **THEN** each recipe entry displays: index number, recipe name, and the `#N` position reference in full-contrast black

#### Scenario: First recipe shows position #1

- **WHEN** the TOC is rendered for a cookbook with at least one recipe
- **THEN** the first recipe entry shows `#1`

#### Scenario: Position references are sequential

- **WHEN** the TOC is rendered for a cookbook with N recipes
- **THEN** recipe entries show position references `#1`, `#2`, … `#N` in order

### Requirement: Prep and cook time is hidden in print TOC

The system SHALL hide the prep/cook time span (`RecipeTimeSpan`) in the printed
TOC so that print output conforms to standard TOC formatting
(index, name, page number only).

#### Scenario: Time is visible on screen

- **WHEN** a user views the TOC page in a browser
- **THEN** prep and cook time (e.g. `15m prep, 30m cook`) is visible on each recipe entry that has time data

#### Scenario: Time is hidden in print

- **WHEN** the TOC page is printed or shown in print preview
- **THEN** prep and cook time is not visible on any recipe entry

### Requirement: Cookbook Print Credits Footer

The system SHALL display the cookbook creator and collaborator list on the printed Table of Contents.

#### Scenario: Render owner and collaborator names for authorized users

- **WHEN** the print page loads for an authenticated user who is the owner or active collaborator of a collaborative cookbook
- **THEN** the Table of Contents print footer displays "Created by: [Owner Name]" and "Collaborators: [Collab 1], [Collab 2]"

#### Scenario: Hide collaborator list for anonymous public viewers

- **WHEN** the print page loads for an unauthenticated anonymous visitor on a public collaborative cookbook
- **THEN** the Table of Contents print footer displays "Created by: [Owner Name]" but the collaborators list is completely hidden

### Requirement: MODIFIED Standalone page background matches the print token family

The shared `CookbookStandalonePage` wrapper (used by both `/cookbooks/$id/toc`
and `/cookbooks/$id/print`) SHALL render its on-screen background using the
same always-light `--theme-print-*` token family already used by its
descendant text and border colors, regardless of the currently active site
theme (`dark`, `dark-greens`, `light-cool`, `light-warm`) — **and this
rendering SHALL be available at first paint, with no window in which the
route's component or its styling is not yet loaded.** The `toc` and `print`
route components SHALL NOT be split into a separate lazily-loaded bundle
chunk that falls outside the app's boot-loader stylesheet-readiness gate
(`#app-shell` visibility in `src/routes/__root.tsx`).

#### Scenario: TOC/print page background is light in the dark theme

- **WHEN** a user with the "Dark (blues)" theme active (`html.dark`) views `/cookbooks/$id/toc` or `/cookbooks/$id/print` (including with `?displayonly=1`)
- **THEN** the page container background renders as the fixed light `--theme-print-bg` value, not the theme's dark `--theme-bg` value, and recipe names, the cookbook title, and footer text remain visible against that background

#### Scenario: Background renders correctly on every load, not just after a settling delay

- **WHEN** a user navigates directly to `/cookbooks/$id/toc` or `/cookbooks/$id/print` with any of the four supported themes active and the page's title heading becomes visible
- **THEN** the nearest ancestor with a non-transparent background already resolves to the fixed light `--theme-print-bg` value — not a transiently transparent background that would otherwise expose the inherited site-theme background color from `<body>`

#### Scenario: TOC/print route components are not emitted as a separate lazy bundle chunk

- **WHEN** the build output's chunk/asset manifest is inspected for a production build of the application
- **THEN** there is no separate JS or CSS chunk containing `CookbookStandalonePage`'s exports that is excluded from the boot-loader's stylesheet-readiness gate — the toc and print routes' component code loads as part of the main application bundle

#### Scenario: TOC/print page background is light in every supported theme

- **WHEN** a user with any of the four supported themes active (`dark`, `dark-greens`, `light-cool`, `light-warm`) views `/cookbooks/$id/toc` or `/cookbooks/$id/print`
- **THEN** the page container background renders identically as the fixed light `--theme-print-bg` value in all four cases

#### Scenario: Actual print output is unaffected

- **WHEN** a user on `/cookbooks/$id/print` triggers the browser print dialog
- **THEN** the printed page background remains white, as already enforced by the existing `@media print` rule in `src/styles/print.css`, unchanged by this requirement

See [design.md](../../changes/archive/2026-07-11-fix-cookbook-print-toc-code-splitting/design.md) and [tasks.md](../../changes/archive/2026-07-11-fix-cookbook-print-toc-code-splitting/tasks.md) for the change that introduced this requirement.

