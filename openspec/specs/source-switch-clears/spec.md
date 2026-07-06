## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-07-05-personal-source-privacy-e2e/design.md) document, not a replacement.

### Requirement: ADDED E2E coverage — server normalization clears personalSourceName on source switch

The system SHALL verify that when a recipe owner saves the recipe with a non-Personal source, the server nulls `personalSourceName`, and a subsequent edit that re-selects Personal shows an empty name field.

#### Scenario: Source switch clears the personal name

- **Given** User A owns a recipe with source=Personal and personalSourceName="Aunt Mary"
- **When** User A opens the edit form, clears the source (clicks the X button in #sourceId), selects any other source, and saves the recipe
- **And** User A opens the edit form again, clears that source, and selects Personal
- **Then** The Personal Name input (`getByLabel("Personal Name")`) has an empty value

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## Traceability

- Proposal element "Source switch clears" → Requirement "server normalization clears personalSourceName"
- Design Decision 4 (X button selector `page.locator('#sourceId').getByRole('button')`) → scenario interaction steps
- Design Decision 2 (waitForResponse timing) → source selection steps
- Requirement → Task: write source-switch-clears test

## Non-Functional Acceptance Criteria

### Requirement: Security

See functional scenario: "Source switch clears the personal name" — this scenario confirms that the server enforces the clear rather than relying on client-side state.
