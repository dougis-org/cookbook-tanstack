## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-07-05-personal-source-privacy-e2e/design.md) document, not a replacement.

### Requirement: ADDED E2E coverage — SourceSelector conditionally reveals Personal Name input

The system SHALL verify that the Personal Name input only appears in the recipe form when the Personal source is selected.

#### Scenario: Personal Name input hidden when no source selected

- **Given** User A is on the new recipe form (`/recipes/new`) with no source selected
- **When** The page loads
- **Then** The Personal Name input (`getByLabel("Personal Name")`) is not visible in the DOM

#### Scenario: Personal Name input revealed when Personal source is selected

- **Given** User A is on the new recipe form with no source selected
- **When** User A types "Personal" into the source combobox, waits for search results, and clicks the "Personal" result
- **Then** The Personal Name input becomes visible

#### Scenario: Personal Name input hidden again after clearing source

- **Given** User A has the Personal source selected (Personal Name input is visible)
- **When** User A clicks the X button inside `#sourceId` to clear the source
- **Then** The Personal Name input is no longer visible

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## Traceability

- Proposal element "Selector conditional" → all three scenarios above
- Design Decision 2 (waitForResponse debounce guard) → "Personal Name input revealed" scenario
- Design Decision 4 (X button selector) → "Personal Name input hidden again" scenario
- Requirement → Task: write selector-conditional test

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Conditional renders correctly without timing issues

- **Given** The SourceSelector's 300ms debounce and network round-trip for `sources.search`
- **When** The test uses `waitForResponse(/\/api\/trpc\/sources\.search/)` before interacting with the dropdown
- **Then** The dropdown result is present before Playwright attempts to click it, eliminating race conditions
