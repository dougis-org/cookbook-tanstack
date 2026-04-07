# cookbook-print-view Specification

## Purpose

Provides a combined print view for a cookbook that renders a Table of Contents,
all recipe content pages, and an alphabetical index in a single printable
document. The layout is optimized for physical printing with appropriate page
breaks between sections.

## Requirements

### Requirement: Print layout begins with a Table of Contents

The system SHALL render a Table of Contents section as the first content block,
listing all recipes in their display-ordered sequence with `#N` position
references, using the same two-column print layout and chapter grouping as the
standalone TOC page.

#### Scenario: TOC renders all recipes in order

- **WHEN** the print route loads for a cookbook with recipes
- **THEN** the TOC lists each recipe by name with its 1-based `#N` position reference in cookbook display order

#### Scenario: TOC section forces a page break before recipes

- **WHEN** the document is printed
- **THEN** the TOC section is followed by a page break so the first recipe begins on a new page

#### Scenario: TOC renders in 2 columns when printed

- **WHEN** the print route is printed for a cookbook with any number of recipes
- **THEN** the TOC recipe list is rendered in 2 columns

#### Scenario: TOC groups recipes by chapter when chapters exist

- **WHEN** the print route loads for a cookbook with chapters
- **THEN** the TOC groups recipes under their chapter headings, in chapter
  order, with global sequential numbering across all chapters

#### Scenario: Chapter headings stay with their recipes when printed

- **WHEN** the document is printed and a column break would leave a chapter
  heading without any recipes below it in the same column
- **THEN** the chapter heading flows to the next column with its recipes

#### Scenario: Recipe entries do not split across column breaks when printed

- **WHEN** the document is printed and a column break falls within a recipe entry in the TOC
- **THEN** the entire recipe entry (number, name, time) moves to the next column rather than splitting

#### Scenario: TOC recipe entries link to individual recipe pages

- **WHEN** a user views the print route in a browser
- **THEN** each TOC entry is a link to the corresponding recipe page at `/recipes/$recipeId`

### Requirement: Print route renders an alphabetical recipe index after all recipe content

The system SHALL render a `CookbookAlphaIndex` section as the final content
block in the print view, after all recipe content sections. The index SHALL use
the same display-ordered recipe list as the TOC so that page numbers are
consistent across both print artifacts. The index section SHALL always begin on
a new print page.

#### Scenario: Index appears at the end of the print document

- **WHEN** the print route loads for a cookbook with recipes
- **THEN** the alphabetical index is rendered after all recipe content blocks

#### Scenario: Index starts on a new print page

- **WHEN** the document is printed for a cookbook with recipes
- **THEN** the alphabetical index section begins on a new page, never sharing a page with the last recipe content section

#### Scenario: Index position references match the TOC

- **WHEN** the print route is rendered for a cookbook
- **THEN** a given recipe's `#N` position reference in the alphabetical index
  is identical to its position reference in the TOC section of the same
  document

#### Scenario: Empty cookbook shows no index section

- **WHEN** the print route loads for a cookbook with no recipes
- **THEN** no alphabetical index section is rendered

### Requirement: Print route accepts displayonly query parameter

The print route SHALL accept a `?displayonly=1` query parameter that suppresses
automatic print dialog invocation, allowing the route to be loaded for display
or preview purposes without triggering the browser print dialog.

#### Scenario: Route loads normally with displayonly param

- **WHEN** a user navigates to `/cookbooks/:cookbookId/print?displayonly=1`
- **THEN** the full print view renders (TOC, recipes, chrome) identically to the non-suppressed route
- **AND** the browser print dialog is not triggered

### Requirement: Print route renders recipe position labels

The system SHALL render a `#N` cookbook position label at the bottom of each
printed recipe section. The label SHALL use the same display-ordered page map
as the TOC and alphabetical index so the cross-references remain consistent,
including when chapters reorder the cookbook display.

#### Scenario: Each recipe section shows a `#N` label

- **WHEN** the print route loads for a cookbook with recipes
- **THEN** each `.cookbook-recipe-section` contains a bottom-aligned `#N` position label for that recipe

#### Scenario: Recipe section labels match TOC and index references

- **WHEN** the print route is rendered for a chaptered or unchaptered cookbook
- **THEN** a recipe's `#N` label at the bottom of its section matches the same
  recipe's reference in the TOC and alphabetical index

#### Scenario: Recipe section label is visible in displayonly mode

- **WHEN** a user opens `/cookbooks/:cookbookId/print?displayonly=1`
- **THEN** the `#N` recipe section labels are visible on screen in muted gray without triggering the browser print dialog
