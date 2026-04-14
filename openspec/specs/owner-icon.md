## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Owner icon on recipe card

The system SHALL render a `User` icon on a `RecipeCard` when `isOwner` is `true`.

#### Scenario: Owner views recipe listing

- **Given** a logged-in user who owns at least one recipe
- **When** they visit `/recipes/`
- **Then** their recipe cards display a `User` icon (aria-label "You own this") in the top-right area, left of the Heart icon

#### Scenario: Non-owner views recipe listing

- **Given** a logged-in user who does not own a particular recipe
- **When** they view that recipe's card on `/recipes/`
- **Then** the `User` icon is absent from that card

#### Scenario: Logged-out user views recipe listing

- **Given** an unauthenticated visitor
- **When** they visit `/recipes/`
- **Then** no `User` icon appears on any recipe card

---

### Requirement: ADDED Owner icon on cookbook card

The system SHALL render a `User` icon on a `CookbookCard` when `isOwner` is `true`.

#### Scenario: Owner views cookbook listing

- **Given** a logged-in user who owns at least one cookbook
- **When** they visit `/cookbooks/`
- **Then** their cookbook cards display a `User` icon (aria-label "You own this") in the bottom metadata row

#### Scenario: Non-owner views cookbook listing

- **Given** a logged-in user who does not own a particular cookbook
- **When** they view that cookbook's card on `/cookbooks/`
- **Then** the `User` icon is absent from that card

#### Scenario: Logged-out user views cookbook listing

- **Given** an unauthenticated visitor
- **When** they visit `/cookbooks/`
- **Then** no `User` icon appears on any cookbook card

---

### Requirement: ADDED Owner icon on recipe detail page

The system SHALL render a `User` icon on the recipe detail page when the logged-in user owns the recipe.

#### Scenario: Owner visits their recipe detail page

- **Given** a logged-in user who owns a recipe
- **When** they navigate to `/recipes/:recipeId`
- **Then** a `User` icon (aria-label "You own this") is visible in the page header/action area

#### Scenario: Non-owner visits a recipe detail page

- **Given** a logged-in user who does not own the recipe
- **When** they navigate to `/recipes/:recipeId`
- **Then** no `User` icon is shown

---

### Requirement: ADDED Owner icon on cookbook detail page

The system SHALL render a `User` icon on the cookbook detail page when the logged-in user owns the cookbook.

#### Scenario: Owner visits their cookbook detail page

- **Given** a logged-in user who owns a cookbook
- **When** they navigate to `/cookbooks/:cookbookId`
- **Then** a `User` icon (aria-label "You own this") is visible near the cookbook title

#### Scenario: Non-owner visits a cookbook detail page

- **Given** a logged-in user who does not own the cookbook
- **When** they navigate to `/cookbooks/:cookbookId`
- **Then** no `User` icon is shown

---

### Requirement: ADDED Print suppression of owner icon

The system SHALL suppress the owner `User` icon in all print output.

#### Scenario: Owner prints a recipe

- **Given** a logged-in user who owns a recipe
- **When** they trigger print on `/recipes/:recipeId` or `/recipes/`
- **Then** the `User` icon is not visible in the printed/print-preview output

#### Scenario: Owner prints a cookbook

- **Given** a logged-in user who owns a cookbook
- **When** they trigger print on `/cookbooks/:cookbookId`
- **Then** the `User` icon is not visible in the printed/print-preview output

---

### Requirement: ADDED `userId` field in `cookbooks.list` response

The system SHALL include a `userId` string field in each item returned by `cookbooks.list`.

#### Scenario: Authenticated request to `cookbooks.list`

- **Given** a tRPC client calls `cookbooks.list`
- **When** the response is received
- **Then** each cookbook item includes a `userId` field containing the owner's id as a string

#### Scenario: Unauthenticated request to `cookbooks.list`

- **Given** an unauthenticated tRPC client calls `cookbooks.list`
- **When** the response is received (public cookbooks only)
- **Then** each item still includes `userId`; the frontend guards icon rendering via `isLoggedIn`

---

### Requirement: ADDED Explicit `userId` in `recipes.list` response

The system SHALL include an explicitly mapped `userId` string field (not via spread) in each item returned by `recipes.list`.

#### Scenario: `recipes.list` response shape

- **Given** a tRPC client calls `recipes.list`
- **When** the response is received
- **Then** each item includes `userId` as an explicit typed field, not inferred from an `any` spread

## MODIFIED Requirements

### Requirement: MODIFIED `RecipeCard` props interface

The `RecipeCard` component SHALL accept an optional `isOwner` boolean prop in addition to its existing `recipe` and `marked` props.

#### Scenario: isOwner prop absent (default behavior)

- **Given** a `RecipeCard` rendered without an `isOwner` prop
- **When** the component renders
- **Then** no `User` icon is shown (backward-compatible default)

---

### Requirement: MODIFIED `CookbookCard` props interface

The `CookbookCard` component SHALL accept an optional `isOwner` boolean prop.

#### Scenario: isOwner prop absent (default behavior)

- **Given** a `CookbookCard` rendered without an `isOwner` prop
- **When** the component renders
- **Then** no `User` icon is shown (backward-compatible default)

## REMOVED Requirements

No requirements are removed by this change.

## Traceability

- Proposal: "Backend exposes `userId` in list responses" → Requirement: ADDED `userId` in `cookbooks.list` + ADDED explicit `userId` in `recipes.list`
- Proposal: "Frontend computes `isOwner`" → Requirement: MODIFIED `RecipeCard`/`CookbookCard` props; ADDED icon on listing cards
- Design Decision 1 (frontend ownership computation) → ADDED owner icon on recipe/cookbook cards + detail pages
- Design Decision 2 (Lucide User icon, accent, print:hidden) → ADDED print suppression requirement
- Design Decision 3 (RecipeCard placement) → ADDED owner icon on recipe card
- Design Decision 4 (CookbookCard placement) → ADDED owner icon on cookbook card
- Design Decision 5 (detail page placement) → ADDED owner icon on detail pages
- Design Decision 6 (explicit userId mapping) → ADDED explicit `userId` in `recipes.list`
- Requirement: ADDED owner icon on recipe card → Tasks: update `RecipeCard`, update `recipes/index.tsx`
- Requirement: ADDED owner icon on cookbook card → Tasks: update `CookbookCard`, update `cookbooks/index.tsx`, update `cookbooks.list` backend
- Requirement: ADDED owner icon on detail pages → Tasks: update `recipes/$recipeId.tsx`, update `cookbooks/$cookbookId.tsx`
- Requirement: ADDED print suppression → Tasks: `print:hidden` class on all icon instances

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: No additional DB queries from ownership indicator

- **Given** the existing recipe or cookbook list query
- **When** `userId` is added to the mapped response
- **Then** no additional database round-trips are introduced (string `toString()` is in-memory only)

### Requirement: Security

#### Scenario: `userId` exposure is scoped to already-visible items

- **Given** a caller (authenticated or anonymous) requests `cookbooks.list` or `recipes.list`
- **When** the response is received
- **Then** `userId` is only present on items the visibility filter already permits the caller to see — no additional data leakage beyond what `byId` endpoints already return

### Requirement: Accessibility

#### Scenario: Owner icon is screen-reader accessible

- **Given** a logged-in owner viewing a recipe or cookbook card or detail page
- **When** a screen reader processes the `User` icon
- **Then** the icon has `aria-label="You own this"` and `role="img"` so its meaning is announced
