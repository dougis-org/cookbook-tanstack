## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED `can()` generic capability helper

The system SHALL export a `can(capability: keyof typeof CAPABILITY_TIERS, tier: string | null | undefined): boolean` function from `src/lib/tier-entitlements.ts`.

#### Scenario: Returns true when caller's tier meets or exceeds the required tier

- **Given** a capability `'createPrivate'` requires `'sous-chef'`
- **When** `can('createPrivate', 'sous-chef')` is called
- **Then** it returns `true`

#### Scenario: Returns true for tiers above the required tier

- **Given** a capability `'createPrivate'` requires `'sous-chef'`
- **When** `can('createPrivate', 'executive-chef')` is called
- **Then** it returns `true`

#### Scenario: Returns false when caller's tier is below the required tier

- **Given** a capability `'import'` requires `'executive-chef'`
- **When** `can('import', 'sous-chef')` is called
- **Then** it returns `false`

#### Scenario: Returns false for null tier

- **Given** a capability `'privateRecipeNotes'` requires `'sous-chef'`
- **When** `can('privateRecipeNotes', null)` is called
- **Then** it returns `false` (null resolves to `home-cook` rank)

#### Scenario: Returns false for undefined tier

- **Given** a capability `'privateRecipeNotes'` requires `'sous-chef'`
- **When** `can('privateRecipeNotes', undefined)` is called
- **Then** it returns `false`

#### Scenario: TypeScript rejects unknown capability names at compile time

- **Given** `CAPABILITY_TIERS` has keys `'createPrivate' | 'privateRecipeNotes' | 'import'`
- **When** a developer writes `can('nonExistent', 'sous-chef')`
- **Then** TypeScript produces a type error; the code does not compile

### Requirement: ADDED hook uses `can()` internally

The system SHALL update `src/hooks/useTierEntitlements.ts` to call `can()` directly for boolean capability fields, rather than calling the named wrapper functions.

#### Scenario: Hook return shape is unchanged after internal update

- **Given** `useTierEntitlements` is rendered for a `'sous-chef'` session user
- **When** the hook resolves
- **Then** it returns `{ tier: 'sous-chef', canCreatePrivate: true, canUsePrivateRecipeNotes: true, canImport: false, recipeLimit: 500, cookbookLimit: 25 }` — identical to pre-refactor

## MODIFIED Requirements

No existing requirements are modified. The hook's public return shape is unchanged.

## REMOVED Requirements

No requirements are removed.

## Traceability

- Proposal element "Generic `can()` helper" → Requirement: ADDED `can()` generic capability helper
- Design decision 2 (`can()` signature and placement) → Requirement: ADDED `can()` generic capability helper
- Design decision 4 (hook internal update) → Requirement: ADDED hook uses `can()` internally
- Requirement: ADDED `can()` → tasks: add-can-helper
- Requirement: ADDED hook uses `can()` internally → tasks: update-hook

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: All existing hook tests pass without modification

- **Given** the test file `src/hooks/__tests__/useTierEntitlements.test.ts` tests the hook's return values
- **When** `npm run test` is executed after the refactor
- **Then** all tests in that file pass with zero modifications to the test file

### Requirement: Security

See functional scenarios above: `can()` delegates directly to `hasAtLeastTier`, which already handles admin bypass and tier ranking. No new security surface is introduced.
