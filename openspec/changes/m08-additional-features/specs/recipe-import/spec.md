## ADDED Requirements

### Requirement: Import page is accessible via navigation
The system SHALL provide an `/import` route that renders a dedicated recipe import page.

#### Scenario: User navigates to import page
- **WHEN** the user clicks an Import link (in the recipe list or header navigation)
- **THEN** the `/import` page renders with a file upload area and instructions

---

### Requirement: User can upload a JSON file via drag-and-drop or file picker
The system SHALL provide a file upload area that accepts `.json` files only, supporting both drag-and-drop and click-to-browse interactions.

#### Scenario: Drag and drop a valid JSON file
- **WHEN** the user drags a `.json` file onto the upload area
- **THEN** the file is accepted and its contents are read

#### Scenario: Click to browse and select a file
- **WHEN** the user clicks the upload area and selects a `.json` file via the file picker
- **THEN** the file is accepted and its contents are read

#### Scenario: Non-JSON file is rejected
- **WHEN** the user attempts to upload a file that is not `.json`
- **THEN** the file is rejected and an error message is displayed; no further processing occurs

---

### Requirement: Uploaded file is parsed and validated
The system SHALL parse the JSON file and validate it against the import schema (same fields as the export format). Validation errors SHALL be clearly listed.

#### Scenario: Valid recipe JSON
- **WHEN** a valid exported recipe JSON is uploaded
- **THEN** the system successfully parses it and proceeds to show the preview modal

#### Scenario: Invalid JSON syntax
- **WHEN** a file with malformed JSON is uploaded
- **THEN** an error message is displayed stating the file is not valid JSON

#### Scenario: Missing required fields
- **WHEN** a valid JSON file is uploaded but lacks required recipe fields (e.g. `title`, `ingredients`)
- **THEN** validation errors are listed per missing field and the user cannot proceed to preview

---

### Requirement: Import preview modal shows parsed data before committing
The system SHALL display a modal showing the parsed recipe data, allowing the user to review (and optionally edit) before creating the recipe.

#### Scenario: Preview displays key recipe fields
- **WHEN** validation passes and the preview modal opens
- **THEN** the modal shows title, servings, difficulty, ingredient count, and a summary of instructions

#### Scenario: User can cancel the import
- **WHEN** the preview modal is open
- **THEN** a Cancel button closes the modal and discards the parsed data without creating a recipe

---

### Requirement: Confirming import creates a new recipe
The system SHALL, on confirm, call the `recipes.import` tRPC mutation which creates a new recipe document in MongoDB from the parsed data.

#### Scenario: Successful import
- **WHEN** the user clicks Confirm in the preview modal
- **THEN** a new recipe is created, the modal closes, and the user is navigated to the new recipe's detail page

#### Scenario: Server validation failure
- **WHEN** the server rejects the import data (e.g. duplicate detection or schema violation)
- **THEN** the modal displays the server error and remains open; no recipe is created

---

### Requirement: Import handles schema version mismatches gracefully
The system SHALL detect when the `_version` field in the import file does not match the current export version and display a warning (but still allow import if data is valid).

#### Scenario: Old version import
- **WHEN** a JSON file with `_version` different from the current version is uploaded and validates successfully
- **THEN** a warning banner is shown in the preview modal noting the version difference, but the Confirm button remains enabled
