### Requirement: Alphabetical index renders recipes A–Z grouped by first letter

The system SHALL provide a `CookbookAlphaIndex` component that accepts a `recipes` array (display-ordered), sorts all recipes alphabetically by name, groups them under first-letter section labels (A, B, C…), and renders each entry with a page number sourced from `buildPageMap(recipes)`. Recipes whose names do not begin with an ASCII letter SHALL be grouped under a `#` section. All letter labels and recipe rows SHALL be rendered as items within a single shared two-column list, so that column flow is continuous across letter boundaries. Letter labels SHALL NOT be rendered as `<h3>` heading elements; they SHALL be styled `<li>` elements within the flat list.

#### Scenario: Recipes are sorted and grouped by first letter

- **WHEN** `CookbookAlphaIndex` is rendered with a mixed-order recipe list
- **THEN** recipes are displayed in A–Z order, with each letter that has at least one recipe shown as a label item above those recipes within the same shared list

#### Scenario: Page numbers match the TOC for the same cookbook

- **WHEN** `CookbookAlphaIndex` is rendered with the same display-ordered recipe list used by `CookbookTocList`
- **THEN** each recipe's page number in the index is identical to its page number in the TOC

#### Scenario: Non-letter first characters go into the # bucket

- **WHEN** a recipe name begins with a digit or non-ASCII character
- **THEN** that recipe appears under a `#` label item in the flat list

#### Scenario: Empty cookbook shows no index

- **WHEN** `CookbookAlphaIndex` is rendered with an empty recipes array
- **THEN** no index content is rendered

#### Scenario: Letter labels and recipe rows share a single column flow when printed

- **WHEN** the index is printed with multiple letter groups
- **THEN** all letter label items and recipe row items are distributed across two columns in a continuous flow without column resets between letter groups

#### Scenario: Letter label does not orphan at a column bottom

- **WHEN** the browser would place a letter label as the last item in a column with no recipe rows beneath it
- **THEN** the letter label flows to the next column along with its first recipe row

### Requirement: Alphabetical index begins on a new print page

The system SHALL ensure that the alphabetical index always starts on a new print page, separate from the last recipe content section.

#### Scenario: Index starts on a new page when printed

- **WHEN** the print view is printed for a cookbook with recipes
- **THEN** the alphabetical index section begins at the top of a new page, never sharing a page with the last recipe content

### Requirement: Alphabetical index is a plain-text print artifact (no navigation links)

Each recipe entry in the index SHALL render as plain text (not a hyperlink), since the index is designed for printed output where links have no utility.

#### Scenario: Index entries are not interactive links

- **WHEN** `CookbookAlphaIndex` is rendered
- **THEN** recipe name entries are not anchor or Link elements
