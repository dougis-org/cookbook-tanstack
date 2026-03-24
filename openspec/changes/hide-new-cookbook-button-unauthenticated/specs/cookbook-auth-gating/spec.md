## ADDED Requirements

### Requirement: New Cookbook button hidden from unauthenticated users
The cookbooks list page SHALL hide the "New Cookbook" button in the page header when the user is not authenticated.

#### Scenario: Button hidden when logged out
- **WHEN** an unauthenticated user visits `/cookbooks`
- **THEN** the "New Cookbook" button is not rendered in the page header

#### Scenario: Button visible when logged in
- **WHEN** an authenticated user visits `/cookbooks`
- **THEN** the "New Cookbook" button is rendered in the page header

### Requirement: Empty-state create button hidden from unauthenticated users
The cookbooks list page SHALL hide the "Create your first cookbook" button in the empty state when the user is not authenticated.

#### Scenario: Empty-state button hidden when logged out
- **WHEN** an unauthenticated user visits `/cookbooks` and no public cookbooks exist
- **THEN** the "Create your first cookbook" button is not rendered

#### Scenario: Empty-state button visible when logged in
- **WHEN** an authenticated user visits `/cookbooks` and no cookbooks are visible
- **THEN** the "Create your first cookbook" button is rendered

### Requirement: Create form inaccessible to unauthenticated users
The inline `CreateCookbookForm` SHALL not be triggerable by unauthenticated users.

#### Scenario: Form cannot be opened when logged out
- **WHEN** an unauthenticated user visits `/cookbooks`
- **THEN** no interaction can open the create cookbook form
