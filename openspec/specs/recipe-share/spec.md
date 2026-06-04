## Requirements

### Requirement: Copy Recipe URL to Clipboard

The system SHALL allow users on a recipe detail page to copy the page URL to their clipboard using a Share button next to the Print button, with temporary success confirmation.

#### Scenario: Happy Path Copying Link

- **Given** a user is viewing a recipe detail page
- **When** the user clicks the Share button with the Link icon
- **Then** the current page URL is copied to the clipboard, the button text changes to "Copied!", the icon changes to a checkmark, an ARIA live region announces "Link copied to clipboard", and after 2 seconds the button resets to its original "Share" and Link icon state.

#### Scenario: Graceful Fallback Copying

- **Given** a user is viewing a recipe detail page and the modern `navigator.clipboard` API is not available (e.g. non-HTTPS context)
- **When** the user clicks the Share button
- **Then** the system falls back to using a temporary off-screen `<textarea>` to perform the copy via `document.execCommand('copy')` and succeeds, showing the "Copied!" visual feedback.

#### Scenario: Fail-Safe Browser Alert

- **Given** a user is viewing a recipe detail page and both modern and legacy clipboard copy methods are blocked or unavailable
- **When** the user clicks the Share button
- **Then** the system triggers a standard browser `alert` containing the URL and instructions to copy it manually.

### Requirement: Recipe Detail Page Actions Layout

The system SHALL include a Share button in the actions bar on the recipe detail card next to the Print button.

#### Scenario: Print Layout Exclusion

- **Given** a user prints the recipe page or enters print preview
- **When** the layout is formatted for printing
- **Then** the Share button is hidden from the print view (styled with `print:hidden`).

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
