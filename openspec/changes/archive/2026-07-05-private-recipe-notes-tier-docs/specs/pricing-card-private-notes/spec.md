## MODIFIED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: MODIFIED Pricing page tier cards display Private Recipe Notes availability

The `src/routes/pricing.tsx` tier card SHALL include a Private Recipe Notes feature row that reflects entitlement for each tier.

#### Scenario: Sous Chef and Executive Chef cards show Private Recipe Notes available

- **Given** a user views the `/pricing` page
- **When** they inspect the Sous Chef or Executive Chef tier card
- **Then** the card contains a row indicating Private Recipe Notes are included (e.g., "Private notes ✓")

#### Scenario: Home Cook and Prep Cook cards show Private Recipe Notes not included

- **Given** a user views the `/pricing` page
- **When** they inspect the Home Cook or Prep Cook tier card
- **Then** the card contains a row indicating Private Recipe Notes are not included (e.g., "No private notes")

### Requirement: MODIFIED Pricing page uses `can()` for all boolean entitlement rows

The `src/routes/pricing.tsx` tier card SHALL derive all boolean feature rows — private recipes, import, private recipe notes — from the generic `can(capability, tier)` function, not named wrapper imports.

#### Scenario: No wrapper functions imported in pricing.tsx

- **Given** the updated `src/routes/pricing.tsx`
- **When** the import block is inspected
- **Then** `canCreatePrivate` and `canImport` are not imported; `can` is imported instead
- **And** `canCreatePrivate` and `canImport` wrapper functions in `tier-entitlements.ts` are unchanged

#### Scenario: TypeScript compilation succeeds

- **Given** the updated `src/routes/pricing.tsx` using `can('createPrivate', tier)`, `can('import', tier)`, `can('privateRecipeNotes', tier)`
- **When** the TypeScript compiler checks the file
- **Then** no type errors are produced (all three keys are valid members of `keyof typeof CAPABILITY_TIERS`)

## REMOVED Requirements

None.

## Traceability

- Proposal element (pricing page missing Private Recipe Notes row) -> Requirement: MODIFIED Pricing page tier cards display Private Recipe Notes availability
- Proposal element (avoid wrapper proliferation) -> Requirement: MODIFIED Pricing page uses `can()` for all boolean entitlement rows
- Design decision 1 (`can()` in pricing.tsx) -> Both MODIFIED requirements above
- Both requirements -> tasks.md task: Update src/routes/pricing.tsx

## Non-Functional Acceptance Criteria

### Requirement: Performance

See functional scenarios above. The change adds a single boolean evaluation per tier card render — no measurable latency impact.

### Requirement: Security

No access-control logic changes. Entitlement is read-only display on a public pricing page. No distinct NFAC security scenario applies.

### Requirement: Reliability

#### Scenario: Pricing page renders without error for all tiers

- **Given** the updated `src/routes/pricing.tsx`
- **When** the pricing page is rendered with any valid `EntitlementTier` value
- **Then** no runtime error occurs and all four rendered tier cards (Home Cook, Prep Cook, Sous Chef, Executive Chef; the `anonymous` tier is excluded from the card grid) display the Private Recipe Notes row
