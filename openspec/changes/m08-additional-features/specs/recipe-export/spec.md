## ADDED Requirements

### Requirement: Export button is visible on the recipe detail page
The system SHALL render an "Export" button on the recipe detail page alongside the existing action controls (edit, delete).

#### Scenario: Export button visible to all users
- **WHEN** a user views any recipe detail page
- **THEN** an Export button (or icon button) is visible in the action area, regardless of whether the user is logged in

---

### Requirement: Clicking Export downloads the recipe as a JSON file
The system SHALL, on export button click, serialise the currently-loaded recipe data into a JSON file and trigger a browser file download. The filename SHALL be `<recipe-slug-or-id>.json`.

#### Scenario: Successful export
- **WHEN** the user clicks the Export button on a recipe detail page
- **THEN** the browser downloads a `.json` file named after the recipe containing all recipe fields

#### Scenario: Exported JSON includes all recipe fields
- **WHEN** the JSON file is opened
- **THEN** it contains: title, description, ingredients (with quantities and units), instructions, servings, difficulty, prepTime, cookTime, classification ids/slugs, source, createdAt, updatedAt, and a `_version` field set to `"1"`

#### Scenario: Export uses cached data without a network request
- **WHEN** the user clicks Export on a recipe that has already loaded
- **THEN** no additional network request is made; the download uses data already in the React Query cache

---

### Requirement: Export file is correctly formatted JSON
The system SHALL produce pretty-printed, human-readable JSON (2-space indent) so the file is useful outside the application.

#### Scenario: JSON is valid and formatted
- **WHEN** the exported file is parsed by a JSON parser
- **THEN** it parses without error and top-level keys are indented with 2 spaces
