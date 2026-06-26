## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Private Recipe Notes listed in tier feature-set docs

The system SHALL document "Private Recipe Notes" as a feature available to Sous Chef and Executive Chef tiers in `docs/user-tier-feature-sets.md`, with an explicit note distinguishing it from the existing public `note` field on Recipe documents.

#### Scenario: Private Recipe Notes appears under Sous Chef

- **Given** `docs/user-tier-feature-sets.md` is opened
- **When** the Sous Chef tier section is read
- **Then** "Private Recipe Notes" (or equivalent heading) is present and clearly labeled as a Sous Chef+ feature

#### Scenario: Private Recipe Notes appears under Executive Chef

- **Given** `docs/user-tier-feature-sets.md` is opened
- **When** the Executive Chef tier section is read
- **Then** "Private Recipe Notes" is present (inherited or explicitly listed)

#### Scenario: Distinction from public note field is documented

- **Given** the Private Recipe Notes entry in the docs
- **When** a developer or product reviewer reads it
- **Then** the entry explicitly distinguishes Private Recipe Notes (per-user, tier-gated) from the public `note` field on the Recipe document (visible to all)

## MODIFIED Requirements

None. Existing tier entries are not removed or changed, only augmented.

## REMOVED Requirements

None.

## Traceability

- Proposal element "docs/user-tier-feature-sets.md lists Private Recipe Notes under Sous Chef and Executive Chef" -> Requirement: ADDED Private Recipe Notes listed in tier feature-set docs
- Design decision 4 (update docs/user-tier-feature-sets.md) -> Requirement: ADDED Private Recipe Notes listed in tier feature-set docs
- Requirement -> Task: "Update docs/user-tier-feature-sets.md for Private Recipe Notes"

## Non-Functional Acceptance Criteria

### Requirement: Performance

Not applicable — this is a documentation-only change with no runtime impact.

### Requirement: Security

Not applicable — documentation does not enforce access control.

### Requirement: Reliability

#### Scenario: Docs remain accurate after future tier changes

- **Given** the docs entry exists
- **When** the tier threshold for Private Recipe Notes changes in a future change
- **Then** the implementer of that change is responsible for updating this entry as part of their change (the spec traceability makes this discoverable)
