## ADDED Requirements

### Requirement: Owner-only header controls hidden from non-owners

The cookbook detail page SHALL hide the **Edit** and **Delete** header buttons when the current user is not the cookbook owner.

#### Scenario: Edit and Delete hidden when logged out

- **GIVEN** a public cookbook exists
- **WHEN** an unauthenticated user visits that cookbook's detail page
- **THEN** the Edit button is not visible
- **AND** the Delete button is not visible

#### Scenario: Edit and Delete hidden when authenticated non-owner

- **GIVEN** a public cookbook created by user A
- **WHEN** user B (authenticated, not the owner) visits that cookbook's detail page
- **THEN** the Edit button is not visible
- **AND** the Delete button is not visible

#### Scenario: Edit and Delete visible for owner

- **GIVEN** a cookbook created by the current user
- **WHEN** the owner visits their cookbook's detail page
- **THEN** the Edit button is visible
- **AND** the Delete button is visible

---

### Requirement: Owner-only Add Recipe control hidden from non-owners

The cookbook detail page SHALL hide the **Add Recipe** button and the empty-state **Add your first recipe** CTA when the current user is not the cookbook owner.

#### Scenario: Add Recipe button hidden when logged out

- **GIVEN** a public cookbook with at least one recipe
- **WHEN** an unauthenticated user visits that cookbook's detail page
- **THEN** the Add Recipe button is not visible

#### Scenario: Add Recipe button hidden for non-owner

- **GIVEN** a public cookbook created by user A
- **WHEN** user B visits that cookbook's detail page
- **THEN** the Add Recipe button is not visible

#### Scenario: Add Recipe button visible for owner

- **GIVEN** a cookbook created by the current user
- **WHEN** the owner visits their cookbook's detail page
- **THEN** the Add Recipe button is visible

---

### Requirement: Recipe row owner controls hidden from non-owners

The cookbook detail page SHALL render a static (non-draggable) recipe list for non-owners, with no drag handles or Remove buttons.

#### Scenario: Drag handle and Remove button hidden when logged out

- **GIVEN** a public cookbook with at least one recipe
- **WHEN** an unauthenticated user visits that cookbook's detail page
- **THEN** no drag handle (aria-label "Drag to reorder") is visible
- **AND** no Remove button (aria-label "Remove …") is visible

#### Scenario: Drag handle and Remove button hidden for non-owner

- **GIVEN** a public cookbook created by user A, containing at least one recipe
- **WHEN** user B visits that cookbook's detail page
- **THEN** no drag handle is visible
- **AND** no Remove button is visible

#### Scenario: Drag handle and Remove button visible for owner

- **GIVEN** a cookbook created by the current user, containing at least one recipe
- **WHEN** the owner visits their cookbook's detail page
- **THEN** drag handles are visible
- **AND** Remove buttons are visible
