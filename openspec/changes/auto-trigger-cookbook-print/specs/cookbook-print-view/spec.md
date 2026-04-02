## ADDED Requirements

### Requirement: Print route accepts displayonly query parameter

The print route SHALL accept a `?displayonly=1` query parameter that suppresses automatic print dialog invocation, allowing the route to be loaded for display or preview purposes without triggering the browser print dialog.

#### Scenario: Route loads normally with displayonly param

- **WHEN** a user navigates to `/cookbooks/:cookbookId/print?displayonly=1`
- **THEN** the full print view renders (TOC, recipes, chrome) identically to the non-suppressed route
- **AND** the browser print dialog is not triggered
