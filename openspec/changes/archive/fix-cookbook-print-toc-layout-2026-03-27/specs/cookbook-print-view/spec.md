## MODIFIED Requirements

### Requirement: Print layout begins with a Table of Contents

The system SHALL render a Table of Contents section as the first content block, listing all recipes in their ordered sequence with position numbers, using the same two-column print layout and chapter grouping as the standalone TOC page.

#### Scenario: TOC renders all recipes in order

- **WHEN** the print route loads for a cookbook with recipes
- **THEN** the TOC lists each recipe by name with its 1-based position number in cookbook order

#### Scenario: TOC section forces a page break before recipes

- **WHEN** the document is printed
- **THEN** the TOC section is followed by a page break so the first recipe begins on a new page

#### Scenario: TOC renders in 2 columns when printed

- **WHEN** the print route is printed for a cookbook with any number of recipes
- **THEN** the TOC recipe list is rendered in 2 columns

#### Scenario: TOC groups recipes by chapter when chapters exist

- **WHEN** the print route loads for a cookbook with chapters
- **THEN** the TOC groups recipes under their chapter headings, in chapter order, with global sequential numbering across all chapters

#### Scenario: Chapter headings stay with their recipes when printed

- **WHEN** the document is printed and a column break would leave a chapter heading without any recipes below it in the same column
- **THEN** the chapter heading flows to the next column with its recipes

#### Scenario: Recipe entries do not split across column breaks when printed

- **WHEN** the document is printed and a column break falls within a recipe entry in the TOC
- **THEN** the entire recipe entry (number, name, time) moves to the next column rather than splitting

#### Scenario: TOC recipe entries link to individual recipe pages

- **WHEN** a user views the print route in a browser
- **THEN** each TOC entry is a link to the corresponding recipe page at `/recipes/$recipeId`
