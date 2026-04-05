## ADDED Requirements

### Requirement: Print route renders an alphabetical recipe index after all recipe content

The system SHALL render a `CookbookAlphaIndex` section as the final content block in the print view, after all recipe content sections. The index SHALL use the same display-ordered recipe list as the TOC so that page numbers are consistent across both print artifacts.

#### Scenario: Index appears at the end of the print document

- **WHEN** the print route loads for a cookbook with recipes
- **THEN** the alphabetical index is rendered after all recipe content blocks

#### Scenario: Index page numbers match the TOC

- **WHEN** the print route is rendered for a cookbook
- **THEN** a given recipe's page number in the alphabetical index is identical to its page number in the TOC section of the same document

#### Scenario: Empty cookbook shows no index section

- **WHEN** the print route loads for a cookbook with no recipes
- **THEN** no alphabetical index section is rendered
