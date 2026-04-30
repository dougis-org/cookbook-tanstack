## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Tier content reconciliation on upgrade

When a user's tier is upgraded, all of their recipes and cookbooks SHALL have `hiddenByTier` set to `false` regardless of prior state.

#### Scenario: Upgrade from sous-chef to executive-chef with mixed hiddenByTier docs

- **Given** a user with tier `sous-chef` who owns 3 recipes: Recipe A (`hiddenByTier: false`), Recipe B (`hiddenByTier: true`), Recipe C (`hiddenByTier: false`), and 2 cookbooks: Cookbook A (`hiddenByTier: true`), Cookbook B (`hiddenByTier: false`)
- **When** an admin changes the user's tier to `executive-chef`
- **Then** all 3 recipes have `hiddenByTier: false` and both cookbooks have `hiddenByTier: false`
- **And** the function returns `recipesUpdated: 3, cookbooksUpdated: 2, recipesHidden: 0, cookbooksHidden: 0, madePublic: 0`

#### Scenario: Upgrade on account with zero content

- **Given** a user with tier `home-cook` who owns no recipes or cookbooks
- **When** an admin changes the user's tier to `prep-cook`
- **Then** the function completes without error
- **And** the function returns `recipesUpdated: 0, cookbooksUpdated: 0, recipesHidden: 0, cookbooksHidden: 0, madePublic: 0`

---

### Requirement: ADDED Tier content reconciliation on downgrade — private content coercion

When a user's tier is downgraded to a tier that cannot create private content, all private recipes and cookbooks SHALL be made public.

#### Scenario: Downgrade from sous-chef to prep-cook (private not allowed)

- **Given** a user with tier `sous-chef` who owns 2 private recipes (isPublic: false) and 1 private cookbook (isPublic: false)
- **When** an admin changes the user's tier to `prep-cook`
- **Then** all 2 private recipes have `isPublic: true` and the cookbook has `isPublic: true`
- **And** the function returns `madePublic: 3` (2 recipes + 1 cookbook)

#### Scenario: Downgrade between public-only tiers (no coercion needed)

- **Given** a user with tier `prep-cook` who owns 1 private recipe (isPublic: false)
- **When** an admin changes the user's tier to `home-cook`
- **Then** the private recipe is made public (coercion still applies because `!canCreatePrivate('home-cook')`)
- **And** the function returns `madePublic: 1`

#### Scenario: Downgrade from sous-chef to prep-cook with zero private content

- **Given** a user with tier `sous-chef` who owns only public recipes and cookbooks
- **When** an admin changes the user's tier to `prep-cook`
- **Then** no content changes visibility
- **And** the function returns `madePublic: 0`

---

### Requirement: ADDED Tier content reconciliation on downgrade — count limit enforcement

When a user's tier is downgraded and their content exceeds the new tier's limits, the oldest documents SHALL remain visible and the excess SHALL be hidden.

#### Scenario: Downgrade from sous-chef to home-cook with 15 recipes (limit: 10)

- **Given** a user with tier `sous-chef` who owns 15 recipes created at ascending timestamps (oldest to newest: Recipe 1 through Recipe 15), and the new tier `home-cook` has a limit of 10 recipes
- **When** an admin changes the user's tier to `home-cook`
- **Then** recipes 1-10 have `hiddenByTier: false` and recipes 11-15 have `hiddenByTier: true`
- **And** the function returns `recipesHidden: 5`
- **And** no recipes have their visibility changed (all were already public)

#### Scenario: Downgrade from sous-chef to prep-cook with exactly at limit (100 recipes, limit: 100)

- **Given** a user with tier `sous-chef` who owns exactly 100 recipes, sorted by createdAt
- **When** an admin changes the user's tier to `prep-cook` (limit: 100)
- **Then** all 100 recipes have `hiddenByTier: false`
- **And** the function returns `recipesHidden: 0`

#### Scenario: Downgrade enforces limits separately for recipes and cookbooks

- **Given** a user with tier `sous-chef` (limits: 500 recipes, 25 cookbooks) who owns 600 recipes and 30 cookbooks
- **When** an admin changes the user's tier to `prep-cook` (limits: 100 recipes, 10 cookbooks)
- **Then** recipes 1-100 have `hiddenByTier: false`, recipes 101-600 have `hiddenByTier: true`
- **And** cookbooks 1-10 have `hiddenByTier: false`, cookbooks 11-30 have `hiddenByTier: true`
- **And** the function returns `recipesHidden: 500, cookbooksHidden: 20`

---

### Requirement: ADDED Combined downgrade: coercion + limit enforcement

On downgrade, private→public coercion and count limit enforcement SHALL both be applied.

#### Scenario: Downgrade from sous-chef to home-cook with 15 private recipes

- **Given** a user with tier `sous-chef` who owns 15 private recipes (isPublic: false), and the new tier `home-cook` has a recipe limit of 10 and cannot have private content
- **When** an admin changes the user's tier to `home-cook`
- **Then** all 15 recipes have `isPublic: true` (coercion)
- **And** recipes 1-10 have `hiddenByTier: false`, recipes 11-15 have `hiddenByTier: true` (limit enforcement)
- **And** the function returns `madePublic: 15, recipesHidden: 5`

---

### Requirement: ADDED Transactional behavior with rollback on failure

Each collection (recipes, cookbooks) SHALL be updated in its own transaction. If a transaction fails, all changes within that transaction SHALL be rolled back.

#### Scenario: Recipe transaction fails, cookbook transaction succeeds

- **Given** a user with tier `sous-chef` who owns recipes and cookbooks, and a simulated failure injected into the recipe update operation
- **When** an admin changes the user's tier to `home-cook`
- **Then** no recipe `hiddenByTier` values are changed (rolled back)
- **And** no cookbook `hiddenByTier` values are changed (not attempted due to recipe failure)
- **And** the function throws an error with code `INTERNAL_SERVER_ERROR`

#### Scenario: Cookbook transaction fails after recipe transaction succeeds

- **Given** a user with tier `sous-chef` who owns recipes and cookbooks, and a simulated failure injected into the cookbook update operation
- **When** an admin changes the user's tier to `home-cook`
- **Then** recipe updates are applied and persisted (recipe transaction committed)
- **And** no cookbook updates are applied (cookbook transaction rolled back)
- **And** the function throws an error with code `INTERNAL_SERVER_ERROR`
- **And** the admin sees partial success with an error for cookbooks

---

### Requirement: ADDED Function return type provides detailed operation counts

The `reconcileUserContent` function SHALL return counts for all three operation types: hidden documents (limit enforcement), made public documents (coercion), and updated documents (upgrade restoration).

#### Scenario: Upgrade returns updated counts, not hidden or made-public

- **Given** a user with tier `home-cook` who owns 5 recipes and 2 cookbooks
- **When** the function is called for an upgrade to `prep-cook`
- **Then** the return value's `recipesUpdated` equals 5, `cookbooksUpdated` equals 2, `recipesHidden` equals 0, `cookbooksHidden` equals 0, `madePublic` equals 0

#### Scenario: Downgrade with only coercion returns madePublic count

- **Given** a user with tier `sous-chef` who owns 3 private recipes and 1 private cookbook, downgrading to `prep-cook`
- **When** the function is called
- **Then** `madePublic` equals 4, `recipesHidden` equals 0, `cookbooksHidden` equals 0

## MODIFIED Requirements

### Requirement: MODIFIED Content visibility filter for authenticated users

The visibility filter used for listing recipes and cookbooks SHALL exclude documents with `hiddenByTier: true` even when the requesting user owns those documents.

#### Scenario: Owner cannot see own hiddenByTier document in list results

- **Given** a user who owns a recipe with `hiddenByTier: true`
- **When** the user queries for their recipes
- **Then** the hidden recipe is not included in the results
- **And** the total count excludes the hidden recipe

#### Scenario: Public document still visible to all users regardless of hiddenByTier

- **Given** a public recipe (isPublic: true) with `hiddenByTier: true`
- **When** any user queries for public recipes
- **Then** the recipe is not visible (hiddenByTier takes precedence over isPublic)

#### Scenario: Anonymous user cannot see hiddenByTier documents

- **Given** an unauthenticated request for public recipes
- **When** the query is executed with `visibilityFilter(null)`
- **Then** no documents with `hiddenByTier: true` are returned regardless of isPublic flag

## Traceability

- Proposal element: `src/lib/reconcile-user-content.ts` (new domain service)
  - Requirement: ADDED Tier content reconciliation on upgrade
  - Requirement: ADDED Tier content reconciliation on downgrade — private content coercion
  - Requirement: ADDED Tier content reconciliation on downgrade — count limit enforcement
  - Requirement: ADDED Combined downgrade: coercion + limit enforcement
  - Requirement: ADDED Transactional behavior with rollback on failure
  - Requirement: ADDED Function return type provides detailed operation counts

- Proposal element: `visibilityFilter` fix in `_helpers.ts`
  - Requirement: MODIFIED Content visibility filter for authenticated users

- Design decision: Decision 2 (separate transactions per collection)
  - Requirement: ADDED Transactional behavior with rollback on failure

- Design decision: Decision 5 (sort by createdAt ASC, keep first N visible)
  - Requirement: ADDED Tier content reconciliation on downgrade — count limit enforcement

- Requirement -> Task(s):
  - ADDED reconciliation specs -> implementation of `reconcileUserContent` in `src/lib/reconcile-user-content.ts`
  - MODIFIED visibilityFilter spec -> update `visibilityFilter()` in `src/server/trpc/routers/_helpers.ts`
  - Transactional behavior -> unit tests with mocked transaction failures in `src/lib/__tests__/reconcile-user-content.test.ts`

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Reconciliation for large content set

- **Given** a user at executive-chef tier (limit: 2500 recipes, 200 cookbooks) who owns exactly 2500 recipes and 200 cookbooks
- **When** the user is downgraded to home-cook (limit: 10 recipes, 1 cookbook)
- **Then** the reconciliation completes within 10 seconds
- **Note**: Not tested in unit tests; monitored in production

### Requirement: Reliability

#### Scenario: Idempotent reconciliation on re-run

- **Given** a user who has already been reconciled (downgraded from sous-chef to prep-cook, 5 recipes hidden)
- **When** reconciliation is called again with the same oldTier/newTier
- **Then** no additional changes occur (documents already in correct state)
- **And** the function returns zero counts for all operations

#### Scenario: Recovery after partial failure

- **Given** a reconciliation that partially failed (recipe transaction succeeded, cookbook transaction failed)
- **When** the admin retries the tier change or runs a manual reconciliation
- **Then** the reconciliation converges to the correct state (both collections updated)
- **And** no documents are left in an intermediate inconsistent state