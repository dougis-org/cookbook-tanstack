## Purpose

Print-only header meta line and footer row rendered by RecipeDetail, driven by the user print placement preferences.

## Requirements

### Requirement: FR1 — Meta grid is hidden on print

The system SHALL apply `print:hidden` to the recipe meta grid container in `RecipeDetail`.

#### Scenario: Grid hidden on print

- **Given** a `RecipeDetail` component rendered with any recipe
- **When** the component mounts
- **Then** the element with the meta grid (`grid grid-cols-2 md:grid-cols-4`) has the class `print:hidden`

### Requirement: Print footer row

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

### Requirement: FR4 — Null fields are omitted; element absent when all fields empty

The system SHALL omit null/zero meta fields from the compact print line and the footer row (no "N/A"). When the header line has no header-placed values and no "Added by", the `print-meta-line` element SHALL NOT be rendered (to avoid a phantom margin on print).

#### Scenario: All fields null

- **Given** a recipe with `prepTime: null`, `cookTime: null`, `servings: null`, `difficulty: null` and all placed in `header`
- **When** `RecipeDetail` renders without "Added by"
- **Then** no element with `data-testid="print-meta-line"` exists in the DOM

#### Scenario: Single field present

- **Given** a recipe with `cookTime: 45` and the other fields null, all placed in `header`
- **When** `RecipeDetail` renders
- **Then** `print-meta-line` contains `Cook: 45m` and no other field

### Requirement: NFR1 — Screen layout unchanged

The system SHALL NOT change the visible screen layout of the recipe meta block.

#### Scenario: Existing meta grid still renders on screen

- **Given** a `RecipeDetail` component rendered with any recipe
- **When** the component mounts in a non-print context
- **Then** the labels "Prep Time", "Cook Time", "Servings", and "Difficulty" are all present in the DOM

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

- Implemented in: `src/components/recipes/RecipeDetail.tsx`
- Tested in: `src/components/recipes/__tests__/RecipeDetail.test.tsx`
- Merged via: dougis-org/cookbook-tanstack#288, dougis-org/cookbook-tanstack#488
- Closes: dougis-org/cookbook-tanstack#284, dougis-org/cookbook-tanstack#461
- Extended by: dougis-org/cookbook-tanstack#699 (customize-recipe-print-header-footer; PRs #704, #707, #709)
- Design: [`design.md`](../../changes/archive/2026-10-24-customize-recipe-print-header-footer/design.md), [`tasks.md`](../../changes/archive/2026-10-24-customize-recipe-print-header-footer/tasks.md)
