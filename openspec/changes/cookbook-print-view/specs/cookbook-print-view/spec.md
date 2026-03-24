## ADDED Requirements

### Requirement: Print route is accessible at a stable URL

The system SHALL provide a dedicated route at `/cookbooks/$cookbookId/print` that renders a print-optimised layout for the cookbook.

#### Scenario: Navigating to the print route

- **WHEN** a user navigates to `/cookbooks/$cookbookId/print` for a public cookbook
- **THEN** the page renders a full-page print layout (no site header, no navigation shell)

#### Scenario: Print route not found for unknown cookbook

- **WHEN** a user navigates to `/cookbooks/nonexistent-id/print`
- **THEN** the page displays a "Cookbook not found" message

---

### Requirement: Unauthenticated users can access public cookbook print routes

The system SHALL allow unauthenticated users to view the print route for any public cookbook, consistent with `cookbook-auth-gating`.

#### Scenario: Unauthenticated access to public cookbook print

- **WHEN** an unauthenticated user navigates to the print route for a public cookbook
- **THEN** the print layout renders successfully without redirecting to login

#### Scenario: Unauthenticated access to private cookbook print

- **WHEN** an unauthenticated user navigates to the print route for a private cookbook
- **THEN** the page displays a "Cookbook not found" message (same as unknown cookbook)

---

### Requirement: Print layout begins with a Table of Contents

The system SHALL render a Table of Contents section as the first content block, listing all recipes in their ordered sequence with position numbers.

#### Scenario: TOC renders all recipes in order

- **WHEN** the print route loads for a cookbook with recipes
- **THEN** the TOC lists each recipe by name with its 1-based position number in cookbook order

#### Scenario: TOC section forces a page break before recipes

- **WHEN** the document is printed
- **THEN** the TOC section is followed by a page break so the first recipe begins on a new page

---

### Requirement: Each recipe renders as full content on its own page

The system SHALL render each recipe with its complete content — name, meta (prep time, cook time, servings, difficulty), ingredients, instructions, notes, nutrition (if present), classification, and taxonomy tags — with a page break before each recipe.

#### Scenario: Full recipe content rendered

- **WHEN** the print route renders a recipe
- **THEN** the recipe section shows: name, meta grid (prepTime, cookTime, servings, difficulty), ingredients list, instructions list, notes (if present), and nutrition panel (if present)

#### Scenario: Page break before each recipe

- **WHEN** the document is printed
- **THEN** each recipe section begins on a new page (page-break-before: always)

#### Scenario: No trailing page break after last recipe

- **WHEN** the document is printed
- **THEN** the last recipe does not generate an empty trailing page (the page-break-before on the last recipe does not produce a blank final page)

#### Scenario: Recipe image is not rendered

- **WHEN** the print route renders a recipe that has an imageUrl
- **THEN** no image is shown (images are excluded from the print view)

---

### Requirement: ServingSizeAdjuster is hidden on the print route

The system SHALL suppress the interactive serving-size scaling widget on the print route.

#### Scenario: ServingSizeAdjuster not visible on print route

- **WHEN** the print route renders a recipe with servings data
- **THEN** the ServingSizeAdjuster component is not rendered (neither on screen nor in print output)

---

### Requirement: Screen-only chrome is hidden when printing

The system SHALL show a back link and print button on screen but hide them from the printed output.

#### Scenario: Print button visible on screen

- **WHEN** a user views the print route in a browser
- **THEN** a "Print" button is visible that triggers `window.print()`

#### Scenario: Navigation chrome hidden in print output

- **WHEN** the document is printed
- **THEN** the back link, print button, and breadcrumb navigation are not present in the printed output

---

### Requirement: Cookbook detail Print button navigates to print route

The system SHALL replace the existing `window.print()` Print button on the cookbook detail page with a navigation link to the print route.

#### Scenario: Print button navigates to print route

- **WHEN** a user clicks the "Print" button on the cookbook detail page (`/cookbooks/$cookbookId`)
- **THEN** the browser navigates to `/cookbooks/$cookbookId/print`

---

### Requirement: Data is fetched in a single query

The system SHALL fetch cookbook metadata and all full recipe documents (including ingredients, instructions, nutrition, taxonomy, source) in a single tRPC call (`cookbooks.printById`).

#### Scenario: Full recipe data available on print route

- **WHEN** the print route loads
- **THEN** all recipes display their ingredients and instructions (not just summary fields like name and prep time)
