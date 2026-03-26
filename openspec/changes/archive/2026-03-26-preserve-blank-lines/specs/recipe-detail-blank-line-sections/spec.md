## ADDED Requirements

### Requirement: Blank lines in ingredient text render as visual spacers
The system SHALL render a blank-line spacer between ingredient groups when the stored ingredients text contains one or more consecutive blank lines between content lines.

#### Scenario: Single blank line between ingredient groups renders as spacer
- **GIVEN** a recipe whose ingredients text contains a blank line between two groups of ingredients
- **WHEN** the recipe detail page renders
- **THEN** a spacer element (no bullet, no content) appears between the two groups

#### Scenario: Multiple consecutive blank lines collapse to a single spacer
- **GIVEN** a recipe whose ingredients text contains two or more consecutive blank lines between groups
- **WHEN** the recipe detail page renders
- **THEN** only a single spacer element appears between the groups (not one per blank line)

#### Scenario: Leading and trailing blank lines are not rendered
- **GIVEN** a recipe whose ingredients text begins or ends with blank lines
- **WHEN** the recipe detail page renders
- **THEN** no spacer element appears at the top or bottom of the ingredient list

#### Scenario: Recipes with no blank lines are unaffected
- **GIVEN** a recipe whose ingredients text has no blank lines
- **WHEN** the recipe detail page renders
- **THEN** the ingredient list renders identically to its previous behaviour (flat list, no spacers)

---

### Requirement: Blank lines in instructions text render as visual spacers with no step number
The system SHALL render a blank-line spacer (with no step number) between instruction groups when the stored instructions text contains blank lines between content lines.

#### Scenario: Single blank line between instruction steps renders as spacer
- **GIVEN** a recipe whose instructions text contains a blank line between two steps
- **WHEN** the recipe detail page renders
- **THEN** a spacer element with no step number appears between the two steps

#### Scenario: Step numbers remain contiguous across spacers
- **GIVEN** a recipe whose instructions text contains a blank line between step 2 and step 3
- **WHEN** the recipe detail page renders
- **THEN** the steps are numbered 1, 2, 3, ... with no gap in numbering caused by the blank line

#### Scenario: Multiple consecutive blank lines collapse to a single spacer
- **GIVEN** a recipe whose instructions text contains two or more consecutive blank lines between steps
- **WHEN** the recipe detail page renders
- **THEN** only a single spacer element appears between the steps

#### Scenario: Leading and trailing blank lines are not rendered
- **GIVEN** a recipe whose instructions text begins or ends with blank lines
- **WHEN** the recipe detail page renders
- **THEN** no spacer element appears at the top or bottom of the instruction list

---

### Requirement: Serving size scaling is unaffected by blank-line entries
The system SHALL scale ingredient quantities correctly when the ingredient list contains blank-line spacer entries.

#### Scenario: Scaling skips blank-line entries
- **GIVEN** a recipe with blank-line-separated ingredient groups and a serving count adjusted via the `ServingSizeAdjuster`
- **WHEN** the scaling factor is applied
- **THEN** blank-line entries remain blank and all content lines are scaled correctly
