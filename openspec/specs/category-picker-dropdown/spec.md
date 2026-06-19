# category-picker-dropdown Specification

## Purpose
TBD - created by archiving change category-dropdown-lazy-fetch. Update Purpose after archive.
## Requirements
### Requirement: ADDED Category Picker Dropdown Lazy Fetching

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

