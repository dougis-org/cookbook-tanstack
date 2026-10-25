## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Print footer row

The system SHALL render, at the end of each printed recipe, a single print-only footer row containing the elements placed in `footer` on the left and the `printFooter` node (for cookbook print, `#N`) on the right. The row SHALL render only when it has at least one footer item or a `printFooter`, SHALL use `break-inside: avoid`, and SHALL render once per recipe.

#### Scenario: Category in the footer (default)

- **Given** a recipe with a classification and default preferences
- **When** it is printed from the recipe page
- **Then** the footer row contains the classification name
- **And** no `printFooter` content is present

#### Scenario: Footer items combined with cookbook page number

- **Given** a cookbook recipe on page 12 with Category and Servings set to `footer`
- **When** the cookbook print page renders
- **Then** the footer row contains Category and Servings on the left and `#12` on the right
- **And** exactly one footer row exists for that recipe

#### Scenario: Cookbook with no footer items

- **Given** a cookbook recipe on page 12 with every element set to `none`
- **When** the cookbook print page renders
- **Then** the footer row contains only `#12`

#### Scenario: Nothing to show

- **Given** a single recipe with every element `none` or not in the footer and no `printFooter`
- **When** it is printed
- **Then** no footer row is rendered

#### Scenario: Footer is print-only

- **Given** any recipe
- **When** it renders in a screen context
- **Then** the footer row is not visible

## MODIFIED Requirements

### Requirement: FR2 — Compact print meta line is present and print-only

The system SHALL render a sibling element with classes `hidden` and `print:block` (`data-testid="print-meta-line"`) containing, joined by ` · `, the elements the user has placed in `header`, followed by "Added by: <name>" when the recipe has a collaborator who added it. The element SHALL NOT render when it would be empty.

#### Scenario: Compact line present with correct visibility classes

- **Given** a `RecipeDetail` rendered with at least one element placed in `header` and a recipe value for it
- **When** the component mounts
- **Then** an element with `data-testid="print-meta-line"` exists and has both `hidden` and `print:block` classes

#### Scenario: Elements placed elsewhere are excluded

- **Given** Prep time `footer`, Cook time `none` and Servings `header`
- **When** `RecipeDetail` renders
- **Then** `print-meta-line` contains `Serves:` and contains neither `Prep:` nor `Cook:`

#### Scenario: Empty header line not rendered

- **Given** all five elements are not in `header` and the recipe has no "Added by"
- **When** `RecipeDetail` renders
- **Then** no element with `data-testid="print-meta-line"` exists

### Requirement: FR3 — Compact line shows all non-null/non-zero fields

The system SHALL include each present header-placed field (prepTime, cookTime, servings, difficulty, and the classification name for Category) in the compact line, joined by ` · `. `prepTime` and `cookTime` use truthy guards (omit `0` and null); `servings` and `difficulty` use `!= null` guards (`servings: 0` is valid). Servings reflects `currentServings` (the user-scaled value). Category prints the classification name as plain text and prints nothing when the recipe has no classification. The same rules apply to the footer row for footer-placed fields.

#### Scenario: All fields present

- **Given** a recipe with `prepTime: 15`, `cookTime: 30`, `servings: 4`, `difficulty: "medium"` and all four placed in `header`
- **When** `RecipeDetail` renders
- **Then** the `print-meta-line` element contains `Prep: 15m`, `Cook: 30m`, `Serves: 4`, and `Medium` separated by ` · `

#### Scenario: Partial fields — only some non-null

- **Given** a recipe with `prepTime: 20`, `cookTime: null`, `servings: null`, `difficulty: "easy"` and all four placed in `header`
- **When** `RecipeDetail` renders
- **Then** the `print-meta-line` contains `Prep: 20m` and `Easy`, does not contain `Cook:` or `Serves:`, and contains no `N/A`

#### Scenario: Scaled servings reflected

- **Given** a recipe with `servings: 4`, the user has incremented the count to `5`, and Servings is placed in `header`
- **When** `RecipeDetail` renders
- **Then** the `print-meta-line` contains `Serves: 5`

#### Scenario: Category in header

- **Given** a recipe with classification "Soups" and Category placed in `header`
- **When** `RecipeDetail` renders
- **Then** `print-meta-line` contains `Soups`

#### Scenario: No classification

- **Given** a recipe without a classification and Category placed in `footer`
- **When** `RecipeDetail` renders
- **Then** the footer row does not contain a Category entry

### Requirement: FR5 — Recipe Print Metadata Line

The system SHALL display the name of the collaborator who added the recipe in collaborative cookbooks, in the header line, regardless of the user's placement preferences.

#### Scenario: Show author name on recipe page in collaborative cookbook

- **Given** a collaborative cookbook (has collaborators) containing a recipe created by collaborator "Alice"
- **When** the print page loads
- **Then** the recipe's printed header line includes "Added by: Alice"

#### Scenario: Hide author name on recipe page in single-user cookbook

- **Given** a cookbook with no collaborators (single-user)
- **When** the print page loads
- **Then** the recipe's printed header line does not show any "Added by" section

#### Scenario: Added by with all elements set to none

- **Given** a collaborative cookbook recipe added by "Alice" and every element `none`
- **When** the print page renders
- **Then** the header line contains only `Added by: Alice`

## Traceability

- Proposal element -> Requirement: Header/footer rendering -> Print footer row, FR2; Category printing -> FR3; "Added by" unchanged -> FR5; Cookbook inherits -> Footer items combined with cookbook page number
- Design decision -> Requirement: Decision 4 -> FR2, FR3, FR5 (each modified); Decision 5 -> Print footer row
- Requirement -> Task(s): see `tasks.md` Execution, PR 2 (tasks 2.x) and PR 3 (tasks 3.x)

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: No added render cost on screen

- **Given** any recipe on screen
- **When** it renders
- **Then** header and footer elements add no visible layout change (see functional scenario: Footer is print-only)

### Requirement: Security

See functional scenarios in `specs/print-preferences/spec.md`: Invalid placement value. Placement affects only where trusted recipe fields print; no new user-controlled markup is rendered.

### Requirement: Reliability

#### Scenario: Footer survives page breaks

- **Given** a long cookbook recipe near a page boundary
- **When** printed
- **Then** the footer row is not split across pages and `#N` appears with the recipe's final content
