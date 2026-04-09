## Requirements

### Requirement: FR1 — Meta grid is hidden on print

The system SHALL apply `print:hidden` to the recipe meta grid container in `RecipeDetail`.

#### Scenario: Grid hidden on print

- **Given** a `RecipeDetail` component rendered with any recipe
- **When** the component mounts
- **Then** the element with the meta grid (`grid grid-cols-2 md:grid-cols-4`) has the class `print:hidden`

### Requirement: FR2 — Compact print meta line is present and print-only

The system SHALL render a sibling element with classes `hidden` and `print:block` containing the compact meta summary when at least one meta field is non-null/non-zero.

#### Scenario: Compact line present with correct visibility classes

- **Given** a `RecipeDetail` component rendered with at least one non-null meta field
- **When** the component mounts
- **Then** an element with `data-testid="print-meta-line"` exists and has both `hidden` and `print:block` classes

### Requirement: FR3 — Compact line shows all non-null/non-zero fields

The system SHALL include each present field (prepTime, cookTime, servings, difficulty) in the compact line, joined by ` · `. `prepTime` and `cookTime` use truthy guards (omit `0`); `servings` and `difficulty` use `!= null` guards (`servings: 0` is valid). Servings reflects `currentServings` (the user-scaled value).

#### Scenario: All fields present

- **Given** a recipe with `prepTime: 15`, `cookTime: 30`, `servings: 4`, `difficulty: "medium"`
- **When** `RecipeDetail` renders
- **Then** the `print-meta-line` element contains `Prep: 15m`, `Cook: 30m`, `Serves: 4`, and `Medium` separated by ` · `

#### Scenario: Partial fields — only some non-null

- **Given** a recipe with `prepTime: 20`, `cookTime: null`, `servings: null`, `difficulty: "easy"`
- **When** `RecipeDetail` renders
- **Then** the `print-meta-line` contains `Prep: 20m` and `Easy`, does not contain `Cook:` or `Serves:`

#### Scenario: Scaled servings reflected

- **Given** a recipe with `servings: 4` and the user has incremented the count to `5`
- **When** `RecipeDetail` renders
- **Then** the `print-meta-line` contains `Serves: 5`

### Requirement: FR4 — Null fields are omitted; element absent when all fields empty

The system SHALL omit null/zero meta fields from the compact print line (no "N/A"). When all fields are absent, the `print-meta-line` element SHALL NOT be rendered (to avoid a phantom margin on print).

#### Scenario: All fields null

- **Given** a recipe with `prepTime: null`, `cookTime: null`, `servings: null`, `difficulty: null`
- **When** `RecipeDetail` renders
- **Then** no element with `data-testid="print-meta-line"` exists in the DOM

#### Scenario: Single field present

- **Given** a recipe with `prepTime: null`, `cookTime: 45`, `servings: null`, `difficulty: null`
- **When** `RecipeDetail` renders
- **Then** the `print-meta-line` contains `Cook: 45m` and no ` · ` separator

### Requirement: NFR1 — Screen layout unchanged

The system SHALL NOT change the visible screen layout of the recipe meta block.

#### Scenario: Existing meta grid still renders on screen

- **Given** a `RecipeDetail` component rendered with any recipe
- **When** the component mounts in a non-print context
- **Then** the labels "Prep Time", "Cook Time", "Servings", and "Difficulty" are all present in the DOM

## Traceability

- Implemented in: `src/components/recipes/RecipeDetail.tsx`
- Tested in: `src/components/recipes/__tests__/RecipeDetail.test.tsx`
- Merged via: dougis-org/cookbook-tanstack#288
- Closes: dougis-org/cookbook-tanstack#284
