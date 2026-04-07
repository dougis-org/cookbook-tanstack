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
