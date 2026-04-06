## MODIFIED Requirements

### Requirement: TOC layout is implemented by a shared component used by both the standalone TOC and the full-print routes

The system SHALL implement the TOC recipe list rendering in a single shared `CookbookTocList` component, used by both the standalone TOC page (`/cookbooks/$id/toc`) and the full cookbook print page (`/cookbooks/$id/print`), so that both routes produce identical TOC output when printed. `CookbookTocList` SHALL call `buildPageMap(recipes)` from `src/lib/cookbookPages.ts` and pass the resulting page number to each `RecipePageRow` as a `pageNumber` prop. On screens at the `sm` breakpoint (≥ 640px) and above, `CookbookTocList` SHALL render its recipe list in two columns. On screens narrower than `sm`, it SHALL render in a single column. Printed output SHALL always render in two columns regardless of screen width.

#### Scenario: Standalone TOC and full-print TOC are visually identical when printed

- **WHEN** the standalone TOC page and the full-print page are both printed for the same cookbook
- **THEN** the TOC sections are visually identical: same column layout, same chapter grouping, same numbering, same entry format, same page numbers

#### Scenario: CookbookTocList is the sole location for TOC print CSS

- **WHEN** a developer inspects the TOC print styling
- **THEN** the 2-column, break-inside-avoid, and chapter-break-after-avoid classes exist only in `CookbookTocList` (not duplicated in route files)

#### Scenario: TOC renders in 2 columns on screens at sm breakpoint and above

- **WHEN** a user views the TOC page in a browser on a screen ≥ 640px wide
- **THEN** the recipe list is rendered in two columns

#### Scenario: TOC renders in 1 column on mobile screens

- **WHEN** a user views the TOC page on a screen narrower than 640px
- **THEN** the recipe list is rendered in a single column
