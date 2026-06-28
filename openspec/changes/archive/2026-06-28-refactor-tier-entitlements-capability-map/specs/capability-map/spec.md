## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED `CAPABILITY_TIERS` constant

The system SHALL export a `CAPABILITY_TIERS` constant from `src/lib/tier-entitlements.ts` that maps every boolean tier-gated capability name to its minimum required `UserTier`.

#### Scenario: Map contains all three current capabilities with correct tiers

- **Given** the module `src/lib/tier-entitlements.ts` is imported
- **When** `CAPABILITY_TIERS` is read
- **Then** it equals `{ createPrivate: 'sous-chef', privateRecipeNotes: 'sous-chef', import: 'executive-chef' }` (deep equality)

#### Scenario: Map values are valid UserTier strings

- **Given** the `UserTier` union type is `'home-cook' | 'prep-cook' | 'sous-chef' | 'executive-chef'`
- **When** TypeScript compiles the module
- **Then** compilation succeeds without errors (values satisfy `Record<string, UserTier>`)

#### Scenario: Adding a new capability requires only one line

- **Given** a developer wants to gate a new feature `bulkExport` at `'executive-chef'`
- **When** they add `bulkExport: 'executive-chef'` to `CAPABILITY_TIERS`
- **Then** `can('bulkExport', tier)` works correctly with no other changes required

## MODIFIED Requirements

### Requirement: MODIFIED named wrapper exports delegate to `can()`

The system SHALL retain `canCreatePrivate`, `canUsePrivateRecipeNotes`, and `canImport` as exported functions, but each SHALL delegate to `can()` rather than calling `hasAtLeastTier` directly.

#### Scenario: Wrappers produce identical results to before the refactor

- **Given** a caller invokes `canCreatePrivate(tier)` for any tier value including `null` and `undefined`
- **When** the function executes
- **Then** it returns the same boolean as it did before the refactor

## REMOVED Requirements

No requirements are removed. All existing public exports are preserved.

## Traceability

- Proposal element "CAPABILITY_TIERS map as data-driven source of truth" → Requirement: ADDED `CAPABILITY_TIERS` constant
- Design decision 1 (`as const satisfies Record<string, UserTier>`) → Requirement: ADDED `CAPABILITY_TIERS` constant
- Design decision 3 (wrappers as one-line delegations) → Requirement: MODIFIED named wrapper exports delegate to `can()`
- Requirement: ADDED `CAPABILITY_TIERS` constant → tasks: add-capability-tiers-map
- Requirement: MODIFIED named wrapper exports → tasks: rewire-wrappers

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: All existing tests pass without modification

- **Given** the test file `src/lib/__tests__/tier-entitlements.test.ts` imports named wrapper exports
- **When** `npm run test` is executed after the refactor
- **Then** all tests in that file pass with zero modifications to the test file
