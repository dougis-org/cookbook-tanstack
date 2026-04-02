## ADDED Requirements

### Requirement: Print route auto-triggers the browser print dialog

When the cookbook print route finishes loading its data, the system SHALL automatically invoke the browser print dialog (`window.print()`) without requiring any additional user interaction, unless the `?displayonly=1` query parameter is present.

#### Scenario: Print dialog fires automatically after data loads

- **WHEN** a user navigates to `/cookbooks/:cookbookId/print` without any query parameters
- **THEN** the browser print dialog is triggered automatically once the cookbook data has loaded and rendered

#### Scenario: Auto-trigger is suppressed by displayonly param

- **WHEN** a user navigates to `/cookbooks/:cookbookId/print?displayonly=1`
- **THEN** the browser print dialog is NOT triggered automatically

#### Scenario: Auto-trigger fires exactly once per page load

- **WHEN** the print route auto-triggers and the user dismisses the print dialog
- **THEN** the dialog does not re-open due to subsequent re-renders or focus events

#### Scenario: Manual PrintButton remains available for re-printing

- **WHEN** the user dismisses the print dialog on the print route
- **THEN** a Print button is visible in the browser (hidden from the printout itself) that can re-invoke the print dialog on click
