## ADDED Requirements

### Requirement: Alphabetical index renders recipes A–Z grouped by first letter

The system SHALL provide a `CookbookAlphaIndex` component that accepts a `recipes` array (display-ordered), sorts all recipes alphabetically by name, groups them under first-letter section headers (A, B, C…), and renders each entry with a page number sourced from `buildPageMap(recipes)`. Recipes whose names do not begin with an ASCII letter SHALL be grouped under a `#` section.

#### Scenario: Recipes are sorted and grouped by first letter

- **WHEN** `CookbookAlphaIndex` is rendered with a mixed-order recipe list
- **THEN** recipes are displayed in A–Z order, with each letter that has at least one recipe shown as a section header above those recipes

#### Scenario: Page numbers match the TOC for the same cookbook

- **WHEN** `CookbookAlphaIndex` is rendered with the same display-ordered recipe list used by `CookbookTocList`
- **THEN** each recipe's page number in the index is identical to its page number in the TOC

#### Scenario: Non-letter first characters go into the # bucket

- **WHEN** a recipe name begins with a digit or non-ASCII character
- **THEN** that recipe appears under a `#` section header in the index

#### Scenario: Empty cookbook shows no index

- **WHEN** `CookbookAlphaIndex` is rendered with an empty recipes array
- **THEN** no index content is rendered

### Requirement: Alphabetical index is a plain-text print artifact (no navigation links)

Each recipe entry in the index SHALL render as plain text (not a hyperlink), since the index is designed for printed output where links have no utility.

#### Scenario: Index entries are not interactive links

- **WHEN** `CookbookAlphaIndex` is rendered
- **THEN** recipe name entries are not anchor or Link elements
