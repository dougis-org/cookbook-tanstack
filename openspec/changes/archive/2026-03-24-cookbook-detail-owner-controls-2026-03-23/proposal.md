## Why

The cookbook detail page (`src/routes/cookbooks.$cookbookId.tsx`) renders all owner-only controls — **Edit**, **Delete**, **Add Recipe**, drag-reorder handles, and per-recipe **Remove** buttons — to every visitor regardless of authentication or ownership. Clicking any of these produces a cryptic tRPC auth/forbidden error. The backend is already correctly protected; this is a UI-only gap. Fixes GitHub issue #199, companion to #190.

## What Changes

- **Edit** and **Delete** header buttons hidden from non-owners
- **Add Recipe** button (and empty-state CTA) hidden from non-owners
- Drag-reorder handles and per-recipe **Remove** buttons hidden from non-owners; non-owners see a plain static recipe list
- No backend changes — all mutation procedures already enforce ownership via `protectedProcedure` + `verifyOwnership`

## Capabilities

### New Capabilities

- `cookbook-detail-owner-gating`: Conditional rendering of owner-only controls on the cookbook detail page based on session ownership

### Modified Capabilities

<!-- No existing spec-level behavior is changing -->

## Impact

- **File:** `src/routes/cookbooks.$cookbookId.tsx` — primary file modified
- **Pattern:** Follows `src/routes/recipes/$recipeId.tsx` (`useSession` → `isOwner` derivation)
- **No API changes**, no new dependencies, no routing changes

## Problem Space

Unauthenticated and non-owner users can see and interact with controls that will always fail with a server error. The fix is client-side conditional rendering gated on `isOwner`.

**In scope:**
- Hide Edit, Delete, Add Recipe, drag handles, and Remove buttons from non-owners
- Use a static (non-sortable) recipe list for non-owners to avoid DnD context violations
- Empty state shows "No recipes in this cookbook yet" for all users (no owner-specific wording)

**Out of scope:**
- Redirecting unauthenticated users (the page has valid public content)
- Showing a sign-in CTA
- Backend changes
- Other pages with similar patterns

## Risks

- **None significant.** Single-file change, follows established pattern, no new dependencies.

## Non-Goals

- Redirecting unauthenticated users who access the URL directly
- Adding a "sign in to manage this cookbook" prompt
- Addressing similar gaps on other pages

## Open Questions

- None — scope fully defined by issue #199 and the established auth pattern.
