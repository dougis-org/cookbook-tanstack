# cookbook-alpha-index Specification

## Purpose

Provides a `CookbookAlphaIndex` component that renders all recipes from a
cookbook in a continuous alphabetical A–Z index, suitable for the back of a
printed cookbook. Recipes are sorted alphabetically, grouped under first-letter
labels in a single flat list that flows continuously across print columns.

## Requirements

### Requirement: Alphabetical index renders recipes A–Z grouped by first letter

The system SHALL provide a `CookbookAlphaIndex` component that accepts a
`recipes` array and optional `chapters` array, sorts all recipes alphabetically
by name, groups them under first-letter section labels (A, B, C…), and renders
each entry with a cookbook position reference sourced from `buildPageMap()`
using the shared display-ordered recipe list. Recipes whose names do not begin
with an ASCII letter SHALL be grouped under a `#` section. All letter labels
and recipe rows SHALL be rendered as items within a single shared list, so that
column flow is continuous across letter boundaries. Letter labels SHALL NOT be
rendered as `<h3>` heading elements; they SHALL be styled `<li>` elements
within the flat list. On screens at the `sm` breakpoint (≥ 640px) and above,
the shared flat list SHALL render in two columns. On screens narrower than
`sm`, it SHALL render in a single column. Printed output SHALL always render in
two columns regardless of screen width.

#### Scenario: Recipes are sorted and grouped by first letter

- **WHEN** `CookbookAlphaIndex` is rendered with a mixed-order recipe list
- **THEN** recipes are displayed in A–Z order, with each letter that has at
  least one recipe shown as a label item above those recipes within the same
  shared list

#### Scenario: Position references match the TOC for the same cookbook

- **WHEN** `CookbookAlphaIndex` is rendered for the same cookbook content used by `CookbookTocList`
- **THEN** each recipe's `#N` position reference in the index is identical to its position reference in the TOC

#### Scenario: Non-letter first characters go into the # bucket

- **WHEN** a recipe name begins with a digit or non-ASCII character
- **THEN** that recipe appears under a `#` label item in the flat list

#### Scenario: Empty cookbook shows no index

- **WHEN** `CookbookAlphaIndex` is rendered with an empty recipes array
- **THEN** no index content is rendered

#### Scenario: Letter labels and recipe rows share a single column flow when printed

- **WHEN** the index is printed with multiple letter groups
- **THEN** all letter label items and recipe row items are distributed across
  two columns in a continuous flow without column resets between letter groups

#### Scenario: Letter label does not orphan at a column bottom

- **WHEN** the browser would place a letter label as the last item in a column with no recipe rows beneath it
- **THEN** the letter label flows to the next column along with its first recipe row

#### Scenario: Alpha Index renders in 2 columns on screens at sm breakpoint and above

- **WHEN** the print preview route is viewed on a screen ≥ 640px wide
- **THEN** the alphabetical index list is rendered in two columns

#### Scenario: Alpha Index renders in 1 column on mobile screens

- **WHEN** the print preview route is viewed on a screen narrower than 640px
- **THEN** the alphabetical index list is rendered in a single column

### Requirement: Alphabetical index begins on a new print page

The system SHALL ensure that the alphabetical index always starts on a new
print page, separate from the last recipe content section.

#### Scenario: Index starts on a new page when printed

- **WHEN** the print view is printed for a cookbook with recipes
- **THEN** the alphabetical index section begins at the top of a new page, never sharing a page with the last recipe content

### Requirement: Alphabetical index is a plain-text print artifact (no navigation links)

Each recipe entry in the index SHALL render as plain text (not a hyperlink),
since the index is designed for printed output where links have no utility.

#### Scenario: Index entries are not interactive links

- **WHEN** `CookbookAlphaIndex` is rendered
- **THEN** recipe name entries are not anchor or Link elements
