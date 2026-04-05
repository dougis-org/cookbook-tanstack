### Requirement: TOC layout is implemented by a shared component used by both the standalone TOC and the full-print routes

The system SHALL implement the TOC recipe list rendering in a single shared `CookbookTocList` component, used by both the standalone TOC page (`/cookbooks/$id/toc`) and the full cookbook print page (`/cookbooks/$id/print`), so that both routes produce identical TOC output when printed. `CookbookTocList` SHALL call `buildPageMap(recipes)` from `src/lib/cookbookPages.ts` and pass the resulting page number to each `RecipePageRow` as a `pageNumber` prop.

#### Scenario: Standalone TOC and full-print TOC are visually identical when printed

- **WHEN** the standalone TOC page and the full-print page are both printed for the same cookbook
- **THEN** the TOC sections are visually identical: same column layout, same chapter grouping, same numbering, same entry format, same page numbers

#### Scenario: CookbookTocList is the sole location for TOC print CSS

- **WHEN** a developer inspects the TOC print styling
- **THEN** the 2-column, break-inside-avoid, and chapter-break-after-avoid classes exist only in `CookbookTocList` (not duplicated in route files)

### Requirement: TOC entry displays estimated print page number

The system SHALL render each TOC entry as: index number, recipe name, and the estimated print page number — in that order. The page number SHALL be right-aligned and de-emphasized on screen.

#### Scenario: TOC entry shows page number in screen view

- **WHEN** a user views the TOC page in a browser
- **THEN** each recipe entry shows a page number (e.g. `pg 5`) to the right, styled with low contrast (`text-gray-500`) so it is de-emphasized relative to the recipe name

#### Scenario: TOC entry shows page number in print

- **WHEN** the TOC page is printed or shown in print preview
- **THEN** each recipe entry displays: index number, recipe name, and the page number in full-contrast black

#### Scenario: First recipe shows page 1

- **WHEN** the TOC is rendered for a cookbook with at least one recipe
- **THEN** the first recipe entry shows `pg 1`

#### Scenario: Page numbers are sequential

- **WHEN** the TOC is rendered for a cookbook with N recipes
- **THEN** recipe entries show page numbers `pg 1`, `pg 2`, … `pg N` in order

### Requirement: Prep and cook time is hidden in print TOC

The system SHALL hide the prep/cook time span (`RecipeTimeSpan`) in the printed TOC so that print output conforms to standard TOC formatting (index, name, page number only).

#### Scenario: Time is visible on screen

- **WHEN** a user views the TOC page in a browser
- **THEN** prep and cook time (e.g. `15m prep, 30m cook`) is visible on each recipe entry that has time data

#### Scenario: Time is hidden in print

- **WHEN** the TOC page is printed or shown in print preview
- **THEN** prep and cook time is not visible on any recipe entry
