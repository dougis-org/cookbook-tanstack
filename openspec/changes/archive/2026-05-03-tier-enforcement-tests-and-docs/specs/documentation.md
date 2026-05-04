## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED docs/user-tier-feature-sets.md contains an Implementation section

The document SHALL contain an "Implementation" section with a table mapping each enforcement area to the file that implements it.

#### Scenario: Implementation section is present and accurate

- **Given** `docs/user-tier-feature-sets.md` is opened
- **When** a developer scans for implementation references
- **Then** an "Implementation" section exists with a table containing at minimum these rows:
  - Tier limits and boolean entitlements → `src/lib/tier-entitlements.ts`
  - Client-side tier hook → `src/hooks/useTierEntitlements.ts`
  - Recipe count + private enforcement → `src/server/trpc/routers/recipes.ts`
  - Cookbook count + private enforcement → `src/server/trpc/routers/cookbooks.ts`
  - Visibility filter (hiddenByTier) → `src/server/trpc/routers/_helpers.ts`
  - Downgrade/upgrade reconciliation → `src/lib/reconcile-user-content.ts`
  - Admin tier change entry point → `src/server/trpc/routers/admin.ts`
  - Tier-wall UI → `src/components/ui/TierWall.tsx`
- **And** each listed file path resolves to an existing file

### Requirement: ADDED src/lib/tier-entitlements.ts contains an enforcement contract comment

The file SHALL contain a block comment explaining the three-layer enforcement contract: server routers, client hook (UI only), and reconciliation module.

#### Scenario: Enforcement contract comment is present

- **Given** `src/lib/tier-entitlements.ts` is opened
- **When** a developer reads the file header
- **Then** a comment exists that describes:
  - Server enforcement lives in tRPC routers only; no logic outside this module + routers
  - Client `useTierEntitlements()` is for UI affordances only — never for access control
  - `reconcile-user-content.ts` applies limits retroactively on downgrade

### Requirement: ADDED src/server/trpc/routers/_helpers.ts documents race tolerance

The `enforceContentLimit` function SHALL include a comment stating that a +1 over-limit race is an accepted tolerance and no locking is needed.

#### Scenario: Race tolerance comment is present

- **Given** `src/server/trpc/routers/_helpers.ts` is opened
- **When** a developer reads `enforceContentLimit`
- **Then** an inline comment notes that the count-then-create pattern intentionally allows a +1 race window

## MODIFIED Requirements

### Requirement: MODIFIED docs/user-tier-feature-sets.md "Implementation Planning Output" section

The existing "Implementation Planning Output" section (which states the document does not define implementation details) SHALL be replaced by the new "Implementation" section described above.

#### Scenario: Old placeholder section is removed

- **Given** `docs/user-tier-feature-sets.md` after the update
- **When** a developer searches for "Implementation Planning Output"
- **Then** no such section heading is found

## REMOVED Requirements

None.

## Traceability

- Proposal element "docs/user-tier-feature-sets.md missing implementation references" → Requirement: Implementation section
- Proposal element "tier-entitlements.ts missing contract note" → Requirement: Enforcement contract comment
- Proposal element "race condition tolerance" → Requirement: Race tolerance comment
- Design decisions 3, 4, 5 → Requirements above
- Requirements → Tasks: Update docs file, update tier-entitlements.ts, update _helpers.ts

## Non-Functional Acceptance Criteria

### Requirement: Operability

#### Scenario: All file paths in the Implementation table are valid

- **Given** the Implementation table is written
- **When** each path is grepped in the repository root
- **Then** every listed file exists at the stated path
