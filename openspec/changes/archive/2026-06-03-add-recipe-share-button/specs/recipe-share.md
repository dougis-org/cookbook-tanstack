## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Copy Recipe URL to Clipboard

The system SHALL allow users on a recipe detail page to copy the page URL to their clipboard using a Share button next to the Print button, with temporary success confirmation.

#### Scenario: Happy Path Copying Link

- **Given** a user is viewing a recipe details page
- **When** the user clicks the Share button with the Link icon
- **Then** the current page URL is copied to the clipboard, the button text changes to "Copied!" and the icon changes to a checkmark, and after 2 seconds the button resets to its original "Share" and Link icon state.

#### Scenario: Graceful Fallback Copying

- **Given** a user is viewing a recipe details page and the modern `navigator.clipboard` API is not available (e.g. non-HTTPS context)
- **When** the user clicks the Share button
- **Then** the system falls back to using a temporary off-screen `<textarea>` to perform the copy via `document.execCommand('copy')` and succeeds, showing the "Copied!" visual feedback.

#### Scenario: Fail-Safe Browser Alert

- **Given** a user is viewing a recipe details page and both modern and legacy clipboard copy methods are blocked or unavailable
- **When** the user clicks the Share button
- **Then** the system triggers a standard browser `alert` containing the URL and instructions to copy it manually.

## MODIFIED Requirements

### Requirement: MODIFIED Recipe Details Page Actions Layout

The system SHALL include a Share button in the actions bar on the recipe details card next to the Print button.

#### Scenario: Print Layout Exclusion

- **Given** a user prints the recipe page or enters print preview
- **When** the layout is formatted for printing
- **Then** the Share button is hidden from the print view (styled with `print:hidden`).

## REMOVED Requirements

None.

## Traceability

- Proposal element -> Requirement:
  - "Share button visible on recipe detail page" -> MODIFIED Recipe Details Page Actions Layout
  - "Copies window.location.href to clipboard" -> ADDED Copy Recipe URL to Clipboard
  - "Brief success message / toast shown after copy" -> ADDED Copy Recipe URL to Clipboard (Scenario: Happy Path Copying Link)
  - "Graceful degradation if navigator.clipboard is unavailable" -> ADDED Copy Recipe URL to Clipboard (Scenarios: Graceful Fallback Copying & Fail-Safe Browser Alert)
  - "Button hidden in print view" -> MODIFIED Recipe Details Page Actions Layout (Scenario: Print Layout Exclusion)
- Design decision -> Requirement:
  - "Decision 1: Use the Link icon" -> MODIFIED Recipe Details Page Actions Layout
  - "Decision 2: Multi-tier Clipboard Copy Strategy" -> ADDED Copy Recipe URL to Clipboard
- Requirement -> Task(s):
  - ADDED Copy Recipe URL to Clipboard -> Implement `ShareButton.tsx` and unit tests
  - MODIFIED Recipe Details Page Actions Layout -> Integrate `ShareButton` in `$recipeId.tsx` and E2E tests

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Latency budget

- **Given** the user clicks the Share button
- **When** the copy operation completes
- **Then** the transition to the "Copied!" state completes within 50ms.

### Requirement: Security

#### Scenario: Direct location binding

- **Given** a page rendering the fallback manual alert
- **When** the link is populated in the manual copy instructions
- **Then** the link is read directly from `window.location.href` to prevent arbitrary injection.

### Requirement: Reliability

#### Scenario: Recovery behavior

- **Given** a failure or omission of the `navigator.clipboard` interface
- **When** the copy command is clicked
- **Then** the fallback sequence continues without raising uncaught runtime exceptions in the console.
