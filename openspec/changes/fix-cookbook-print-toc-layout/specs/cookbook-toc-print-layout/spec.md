## ADDED Requirements

### Requirement: TOC layout is implemented by a shared component used by both the standalone TOC and the full-print routes

The system SHALL implement the TOC recipe list rendering in a single shared `CookbookTocList` component, used by both the standalone TOC page (`/cookbooks/$id/toc`) and the full cookbook print page (`/cookbooks/$id/print`), so that both routes produce identical TOC output when printed.

#### Scenario: Standalone TOC and full-print TOC are visually identical when printed

- **WHEN** the standalone TOC page and the full-print page are both printed for the same cookbook
- **THEN** the TOC sections are visually identical: same column layout, same chapter grouping, same numbering, same entry format

#### Scenario: CookbookTocList is the sole location for TOC print CSS

- **WHEN** a developer inspects the TOC print styling
- **THEN** the 2-column, break-inside-avoid, and chapter-break-after-avoid classes exist only in `CookbookTocList` (not duplicated in route files)
