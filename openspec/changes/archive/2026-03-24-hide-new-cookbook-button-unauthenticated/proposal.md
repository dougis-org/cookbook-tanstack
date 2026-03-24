## Why

The **New Cookbook** button on `/cookbooks` is visible to unauthenticated users, but clicking it throws a tRPC authentication error with no redirect or explanation. Milestone 04 specifies this action should be gated to authenticated users only. Fixes GitHub issue #190.

## What Changes

- The "New Cookbook" button (top-right header row) is hidden when the user is not logged in
- The "Create your first cookbook" empty-state button is hidden when the user is not logged in
- No change to the backend — `visibilityFilter` already returns the correct union of public cookbooks + the authenticated user's private cookbooks

## Capabilities

### New Capabilities

- `cookbook-auth-gating`: Conditional rendering of cookbook create actions based on authentication state

### Modified Capabilities

<!-- No existing spec-level behavior is changing — the backend visibility logic is already correct -->

## Impact

- **File:** `src/routes/cookbooks.tsx` — only file modified
- **Pattern:** Follows the existing `useSession` pattern from `src/routes/recipes/index.tsx`
- **No API changes**, no new dependencies, no routing changes

## Problem Space

Unauthenticated users can see and click create affordances that require authentication, resulting in a confusing auth error. The fix is purely client-side conditional rendering.

**In scope:**
- Hide "New Cookbook" button when logged out
- Hide "Create your first cookbook" empty-state button when logged out

**Out of scope:**
- Showing a "Sign in to create cookbooks" prompt (not required by the spec; empty state is rarely reached by logged-out users since public cookbooks are visible)
- Any server-side changes
- Other pages with similar patterns (separate issues)

## Risks

- **None significant.** Single-file change, follows established pattern, no new dependencies.

## Non-Goals

- Redirecting unauthenticated users who attempt to access the create flow via URL
- Adding a sign-in CTA to the empty state
- Fixing similar gaps on other pages

## Open Questions

- None — scope is fully defined by issue #190 and the existing auth pattern.
