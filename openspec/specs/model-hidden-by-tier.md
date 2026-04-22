# Spec: hiddenByTier Model Field

## ADDED Requirements

### Requirement: ADDED `hiddenByTier` field on Recipe and Cookbook models

The system SHALL persist a `hiddenByTier` boolean field (default `false`) on every Recipe and Cookbook document.

#### Scenario: New recipe has hiddenByTier false by default

- **Given** no explicit `hiddenByTier` value is provided on create
- **When** a new Recipe is saved
- **Then** `hiddenByTier` is `false` on the saved document

#### Scenario: New cookbook has hiddenByTier false by default

- **Given** no explicit `hiddenByTier` value is provided on create
- **When** a new Cookbook is saved
- **Then** `hiddenByTier` is `false` on the saved document

### Requirement: ADDED `hiddenByTier` included in list and get response payloads

The system SHALL include `hiddenByTier` in all `recipes.list`, `recipes.get`, `cookbooks.list`, and `cookbooks.get` responses so the UI can render greyed-out state.

#### Scenario: hiddenByTier in recipes.list response

- **Given** a recipe with `hiddenByTier: false`
- **When** `recipes.list` is called
- **Then** each recipe item in the response includes `hiddenByTier: false`

#### Scenario: hiddenByTier in cookbooks.list response

- **Given** a cookbook with `hiddenByTier: false`
- **When** `cookbooks.list` is called
- **Then** each cookbook item in the response includes `hiddenByTier: false`

## MODIFIED Requirements

None. No existing model requirements changed; this is a purely additive field.

## REMOVED Requirements

None.

## Traceability

- Proposal element "add hiddenByTier to Recipe and Cookbook models" → Requirement: ADDED hiddenByTier field
- Design decision 2 (count exclusion) → hiddenByTier must exist for `$ne: true` filter to work
- Design decision 6 (hiddenByTier in response payloads) → Requirement: ADDED hiddenByTier in list/get responses
- Requirements → Tasks: task "Add hiddenByTier to Recipe model", task "Add hiddenByTier to Cookbook model"

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Existing documents without the field behave correctly in count

- **Given** a legacy Recipe document with no `hiddenByTier` field
- **When** `countDocuments({ hiddenByTier: { $ne: true } })` is run
- **Then** the document is included in the count (absent field treated as not-true by `$ne`)
