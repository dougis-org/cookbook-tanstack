# category-picker-dropdown Specification

## Purpose
A single-select dropdown component (`CategoryPickerDropdown`) for selecting a category on the recipe form. To optimize performance and eliminate page-load delay, option queries are deferred (lazy-fetched) until the dropdown is opened, while displaying the selected category name immediately from preloaded data.

## Requirements
### Requirement: Category Picker Dropdown Lazy Fetching

The Category Picker Dropdown SHALL lazy-fetch option list values only when the dropdown panel is opened, rather than on page mount.

#### Scenario: Dropdown does not query classifications on mount

- **Given** the user navigates to the Recipe form
- **When** the form loads
- **Then** no classifications query is executed

#### Scenario: Dropdown queries classifications on open

- **Given** the user is on the Recipe form
- **When** the user clicks the Category dropdown button to open it
- **Then** a classifications query is executed to fetch options

#### Scenario: Selected Category displays immediately on mount

- **Given** an existing recipe with `classificationId` and `classificationName` loaded
- **When** the edit form mounts
- **Then** the Category dropdown immediately displays the correct `classificationName` before any network query is executed

## Traceability

- Component implementation: [CategoryPickerDropdown.tsx](file:///home/doug/dev2/cookbook-tanstack/src/components/ui/CategoryPickerDropdown.tsx)
- Unit and behavioral tests: [CategoryPickerDropdown.test.tsx](file:///home/doug/dev2/cookbook-tanstack/src/components/ui/__tests__/CategoryPickerDropdown.test.tsx)
- Integration tests: [RecipeForm.test.tsx](file:///home/doug/dev2/cookbook-tanstack/src/components/recipes/__tests__/RecipeForm.test.tsx)


