## Context

- Relevant architecture: TanStack Start + tRPC. Recipes and Cookbooks are stored in MongoDB with a `userId` field tracking the creator. tRPC routers expose list and byId endpoints. React components (`RecipeCard`, `CookbookCard`) render cards in listing pages. Detail pages (`recipes/$recipeId.tsx`, `cookbooks/$cookbookId.tsx`) already compute `isOwner` via `useAuth()`.
- Dependencies: `lucide-react` (already installed), `useAuth` hook, tRPC routers for recipes and cookbooks.
- Interfaces/contracts touched:
  - `cookbooks.list` tRPC output type (adds `userId`)
  - `recipes.list` tRPC output type (makes `userId` explicit)
  - `RecipeCard` props interface (adds `isOwner?`)
  - `CookbookCard` props interface (adds `isOwner?`)

## Goals / Non-Goals

### Goals

- Logged-in owners see a `User` icon on their recipe and cookbook cards and on detail pages.
- Icon is absent for non-owners and logged-out users.
- Icon never appears in print output.
- Backend list endpoints explicitly type `userId` so the frontend can compute ownership.

### Non-Goals

- Server-side `isOwner` boolean field.
- Displaying owner name, avatar, or any additional identity information.
- Changing access-control logic.
- Ownership UI on TOC or print routes.

## Decisions

### Decision 1: Ownership computation on the frontend

- Chosen: Backend list endpoints return `userId: string | null`. Frontend computes `isOwner = isLoggedIn && item.userId === userId` using `useAuth()`.
- Alternatives considered: Server returns `isOwner: boolean` (like `marked`).
- Rationale: Keeps the pattern simple and consistent with `byId` endpoints which already return `userId`. The `marked` pattern requires the user to be authenticated on the server, which adds a db lookup; owner check is a pure string comparison requiring no db work.
- Trade-offs: Exposes `userId` in list responses (accepted — `byId` already does this; ObjectId is not a credential).

### Decision 2: Lucide `User` icon, accent-colored, 4×4, print:hidden

- Chosen: `<User className="w-4 h-4 shrink-0 text-[var(--theme-accent)] print:hidden" />` with `aria-label="You own this"`.
- Alternatives considered: Badge ("Mine"), crown icon, border highlight.
- Rationale: Confirmed in explore session. Icon is compact, matches existing Heart icon pattern, accent color ties it to the app's identity palette, `print:hidden` is the established pattern for suppressing interactive/decorative elements from print.
- Trade-offs: No text label — relies on icon recognition. Tooltip is a non-goal for this change; can be added later.

### Decision 3: Placement in RecipeCard (top-right, left of Heart)

- Chosen: `User` icon rendered left of the `Heart` icon in the top-right flex group.
- Alternatives considered: Bottom row, badge overlay on image.
- Rationale: Top-right is already the "status icon zone" (Heart lives there). Grouping ownership with save state is natural. The `Heart` only renders when `marked !== undefined` so the two icons compose cleanly.
- Trade-offs: When both icons are present the top-right has two icons — acceptable given their small size.

### Decision 4: Placement in CookbookCard (bottom row, alongside Private badge)

- Chosen: `User` icon rendered in the bottom `flex items-center justify-between` row, alongside the existing "Private" badge.
- Alternatives considered: Near the title.
- Rationale: Bottom row is the metadata zone. The "Private" badge already lives there; ownership is metadata of the same tier.
- Trade-offs: None significant.

### Decision 5: Placement on detail pages (near action bar / title)

- Chosen:
  - `recipes/$recipeId.tsx`: `User` icon inside the `mb-6 flex items-center justify-between` bar, on the left `<span />` slot (which is currently empty), replacing it.
  - `cookbooks/$cookbookId.tsx`: `User` icon appended after the cookbook title in the header section.
- Rationale: Both detail pages have a header/action row. The recipe page's left `<span />` is a placeholder; cookbook detail has a visible title area. Both already guard `isOwner` for edit controls, so the ownership signal belongs in the same visual region.
- Trade-offs: Recipe detail currently has an empty left slot — replacing `<span />` with the icon is non-breaking.

### Decision 6: `recipes.list` explicit userId mapping

- Chosen: Add `userId: r.userId?.toString() ?? null` explicitly to the map function in `recipes.ts` list handler, removing reliance on `...r` spread for this field.
- Alternatives considered: Leave spread as-is (userId already leaks through `any[]`).
- Rationale: Type safety. The spread returns `any`, making the tRPC inferred output type loose. Explicit mapping gives tRPC a typed field to infer.
- Trade-offs: Minor diff noise — one extra line in the map.

## Proposal to Design Mapping

- Proposal element: Backend exposes `userId` in list responses
  - Design decision: Decision 1 + Decision 6
  - Validation approach: tRPC type check; integration test asserts `userId` present in list response

- Proposal element: Frontend computes `isOwner`
  - Design decision: Decision 1
  - Validation approach: Unit test `RecipeCard` and `CookbookCard` with `isOwner` true/false

- Proposal element: `User` icon, accent-colored, `print:hidden`
  - Design decision: Decision 2
  - Validation approach: Component render test; Playwright print media check

- Proposal element: Icon placement on listing cards
  - Design decision: Decisions 3 + 4
  - Validation approach: Component snapshot / render test

- Proposal element: Icon on detail pages
  - Design decision: Decision 5
  - Validation approach: Playwright E2E — owner sees icon, non-owner does not

- Proposal element: Suppressed for logged-out users
  - Design decision: `isLoggedIn &&` guard at call sites
  - Validation approach: Unit test with `isLoggedIn=false`; E2E logged-out check

## Functional Requirements Mapping

- Requirement: Logged-in owner sees `User` icon on recipe cards
  - Design element: `RecipeCard` `isOwner` prop + Decision 3
  - Acceptance criteria reference: specs/owner-icon.md — recipe card
  - Testability notes: Unit test `RecipeCard` with `isOwner={true}`; assert icon present

- Requirement: Logged-in non-owner does NOT see icon on recipe cards
  - Design element: `isOwner={false}` → icon not rendered
  - Acceptance criteria reference: specs/owner-icon.md — recipe card non-owner
  - Testability notes: Unit test `RecipeCard` with `isOwner={false}`

- Requirement: Logged-out user does NOT see icon
  - Design element: `isLoggedIn &&` guard at listing page
  - Acceptance criteria reference: specs/owner-icon.md — logged-out
  - Testability notes: E2E test as anonymous user

- Requirement: Icon absent from print output
  - Design element: `print:hidden` Tailwind class on icon
  - Acceptance criteria reference: specs/owner-icon.md — print suppression
  - Testability notes: Playwright `page.emulateMedia({ media: 'print' })` then assert icon not visible

- Requirement: Cookbook card shows icon for owner
  - Design element: `CookbookCard` `isOwner` prop + Decision 4
  - Acceptance criteria reference: specs/owner-icon.md — cookbook card
  - Testability notes: Unit test `CookbookCard` with `isOwner={true}`

- Requirement: Detail pages show icon for owner
  - Design element: Decision 5
  - Acceptance criteria reference: specs/owner-icon.md — detail pages
  - Testability notes: Playwright E2E on recipe and cookbook detail pages

## Non-Functional Requirements Mapping

- Requirement category: performance
  - Requirement: No additional DB queries introduced
  - Design element: `userId` is already on the document; `toString()` in map is O(1)
  - Acceptance criteria reference: N/A — no regression on query count
  - Testability notes: Review router code; no new DB calls in list handlers

- Requirement category: security
  - Requirement: `userId` exposure in list API is an accepted trade-off
  - Design element: Decision 1 risk acceptance
  - Acceptance criteria reference: Noted in proposal risks section
  - Testability notes: No test required; documented decision

- Requirement category: accessibility
  - Requirement: Icon is accessible
  - Design element: `aria-label="You own this"` on `<User />` icon
  - Acceptance criteria reference: specs/owner-icon.md — accessibility
  - Testability notes: Assert `aria-label` present in render test

## Risks / Trade-offs

- Risk/trade-off: `userId` exposed in list responses
  - Impact: Low — already exposed in byId responses; ObjectId is not a secret
  - Mitigation: Accepted per proposal; can move to server-side `isOwner` bool in a future change

- Risk/trade-off: Two icons in RecipeCard top-right when both owned and marked
  - Impact: Minor visual density increase
  - Mitigation: Icons are small (w-4 h-4); visual testing confirms acceptable appearance

## Rollback / Mitigation

- Rollback trigger: Icon appears in print output, or unexpected type errors from the explicit `userId` mapping.
- Rollback steps: Revert the four files touched (two routers, two card components, two listing pages, two detail pages). No data migration needed — purely UI and API shape change.
- Data migration considerations: None.
- Verification after rollback: `npm run build` passes; print view confirmed clean.

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the failing check before proceeding.
- If security checks fail: Treat as a blocker; review the `userId` exposure concern and reassess Decision 1 if flagged.
- If required reviews are blocked/stale: Re-request review after 48 hours; escalate to maintainer if still blocked after 5 days.
- Escalation path and timeout: Tag maintainer on PR after 5 business days of no review activity.

## Open Questions

No open questions. All design decisions finalized during explore session for issue #311.
