## GitHub Issues

- #311

## Why

- Problem statement: Users browsing cookbook and recipe listings have no visual indication of which items they own vs. items they can see but not edit. This creates confusion — especially once public sharing is in play — about what a user can act on.
- Why now: Ownership-aware UI is foundational before more sharing/visibility features land. The data layer already tracks `userId` on both `Recipe` and `Cookbook` documents; this change surfaces it visually.
- Business/user impact: Reduces confusion about edit permissions; sets the pattern for ownership indicators used by future features (e.g., bulk actions, sharing controls).

## Problem Space

- Current behavior: Recipe listing and cookbook listing show all visible items (owned + public) with no visual distinction between them. Detail pages use `isOwner` internally to gate edit/delete controls, but show no persistent ownership signal.
- Desired behavior: Logged-in users see a `User` icon (Lucide) on cards and detail pages for items they own. The icon is suppressed when not logged in and in all print output.
- Constraints:
  - Icon must be `print:hidden` — no ownership markers in printed output.
  - Ownership is determined on the **frontend** by comparing the item's `userId` field to the authenticated user's id from `useAuth()`.
  - Backend exposes `userId` as a raw string in list responses; frontend derives `isOwner`.
  - No new auth or permission logic — purely a visual indicator.
- Assumptions:
  - `recipes.byId` and `cookbooks.byId` already return `userId`; no backend change needed for detail pages.
  - `cookbooks.list` currently omits `userId`; it must be added.
  - `recipes.list` currently leaks `userId` via `...spread` on an `any[]` type; it should be made explicit for type safety.
  - `useAuth()` reliably returns `userId` for logged-in sessions.
- Edge cases considered:
  - Logged-out users: `isLoggedIn` is false → icon never renders.
  - Items with no `userId` (e.g., seeded/legacy data): `userId === undefined` → `isOwner` is false → no icon.
  - Print view: `print:hidden` suppresses icon on both card and detail page.

## Scope

### In Scope

- `cookbooks.list` tRPC endpoint: add `userId` field to response.
- `recipes.list` tRPC endpoint: make `userId` explicit in mapped response (remove reliance on `any` spread).
- `RecipeCard` component: add `isOwner?: boolean` prop; render `User` icon when true.
- `CookbookCard` component: add `isOwner?: boolean` prop; render `User` icon when true.
- `recipes/index.tsx`: compute and pass `isOwner` to `RecipeCard`.
- `cookbooks/index.tsx`: compute and pass `isOwner` to `CookbookCard`.
- `recipes/$recipeId.tsx` (detail page): add `User` icon near the action row, `print:hidden`.
- `cookbooks/$cookbookId.tsx` (detail page): add `User` icon near cookbook header, `print:hidden`.

### Out of Scope

- Any changes to visibility, access control, or permissions logic.
- Displaying the owner's name or avatar.
- Filtering/sorting by ownership (the existing "My Recipes" filter already covers that use case).
- Cookbook TOC or print page (`cookbooks.$cookbookId_.toc.tsx`, `cookbooks.$cookbookId_.print.tsx`).

## What Changes

- **Backend** (`cookbooks.ts` router list handler): add `userId: cb.userId?.toString() as string` to the mapped response object.
- **Backend** (`recipes.ts` router list handler): add explicit `userId: r.userId?.toString() as string` to the mapped item object (already present via spread but untyped).
- **`RecipeCard`**: accept `isOwner?: boolean`; render `<User className="w-4 h-4 print:hidden text-[var(--theme-accent)]" />` top-right alongside the Heart icon.
- **`CookbookCard`**: accept `isOwner?: boolean`; render `<User className="w-4 h-4 print:hidden text-[var(--theme-accent)]" />` in the bottom row alongside the "Private" badge area.
- **`recipes/index.tsx`**: pass `isOwner={isLoggedIn && recipe.userId === userId}` to `RecipeCard`.
- **`cookbooks/index.tsx`**: pass `isOwner={isLoggedIn && cb.userId === userId}` to `CookbookCard`.
- **`recipes/$recipeId.tsx`**: add `User` icon (wrapped in `isLoggedIn && isOwner` guard, `print:hidden`) near the existing action bar.
- **`cookbooks/$cookbookId.tsx`**: add `User` icon (wrapped in `isOwner` guard, `print:hidden`) near the cookbook page title.

## Risks

- Risk: Exposing `userId` in list API responses leaks internal user identifiers.
  - Impact: Low — `userId` is already returned by `byId` endpoints for both recipes and cookbooks. It's an internal MongoDB ObjectId string, not a sensitive credential.
  - Mitigation: Accepted. If a stricter API surface is needed later, a separate `isOwner` boolean field can replace `userId` in a follow-up change.

- Risk: Type drift if the `recipes.list` spread continues to include unmapped fields.
  - Impact: Low — tRPC infers types from the return value; explicit mapping tightens this.
  - Mitigation: Making `userId` explicit in the map removes the reliance on spread-based leak.

## Open Questions

No unresolved ambiguity. All design decisions were confirmed during the explore session (issue #311):
- Owner ID exposed from backend, `isOwner` computed on frontend ✓
- `User` icon (Lucide) as the visual indicator ✓
- Suppressed for logged-out users and in print output ✓
- Detail pages included, TOC/print pages excluded ✓

## Non-Goals

- Role-based access control or multi-owner scenarios.
- Tooltip or label on the owner icon (icon alone is sufficient for now).
- Server-side `isOwner` boolean (frontend comparison is intentional per design discussion).

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
