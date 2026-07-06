## MODIFIED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-07-05-private-recipe-notes-tier-docs/design.md) document, not a replacement.

### Requirement: MODIFIED Home Cook tier section explicitly excludes private recipe notes

The Home Cook section of `docs/user-tier-feature-sets.md` SHALL include an explicit statement that private recipe notes are not available to Home Cook users.

#### Scenario: Home Cook section lists private notes exclusion

- **Given** a reader views `docs/user-tier-feature-sets.md`
- **When** they read the Home Cook section
- **Then** the section contains a sentence stating that private recipe notes are not available (in addition to the existing restrictions on private recipes, private cookbooks, and import)

### Requirement: MODIFIED Prep Cook tier section explicitly excludes private recipe notes

The Prep Cook section of `docs/user-tier-feature-sets.md` SHALL include an explicit statement that private recipe notes are not available to Prep Cook users.

#### Scenario: Prep Cook section lists private notes exclusion

- **Given** a reader views `docs/user-tier-feature-sets.md`
- **When** they read the Prep Cook section
- **Then** the section contains a sentence stating that private recipe notes are not available (in addition to the existing restrictions on private recipes, private cookbooks, and import)

### Requirement: MODIFIED Doc distinguishes public recipe notes from private recipe notes

The `docs/user-tier-feature-sets.md` exclusion language SHALL make clear that public recipe notes remain available to all tiers; only private recipe notes are the excluded feature.

#### Scenario: Exclusion sentence references public vs private distinction

- **Given** a reader views the Home Cook or Prep Cook section
- **When** they read the private notes exclusion sentence
- **Then** the sentence distinguishes "private recipe notes" from the existing public note field, confirming public notes remain available

## REMOVED Requirements

None.

## Traceability

- Proposal element (Home Cook missing exclusion) -> Requirement: MODIFIED Home Cook tier section
- Proposal element (Prep Cook missing exclusion) -> Requirement: MODIFIED Prep Cook tier section
- Design decision 2 (prose additions, not table changes) -> Both MODIFIED requirements above
- Both requirements -> tasks.md task: Update docs/user-tier-feature-sets.md

## Non-Functional Acceptance Criteria

### Requirement: Reliability

No runtime behavior is involved. This spec covers documentation content only.

#### Scenario: Doc remains valid Markdown

- **Given** the updated `docs/user-tier-feature-sets.md`
- **When** rendered by any standard Markdown parser
- **Then** no Markdown syntax errors occur and all existing headings, tables, and links remain intact
