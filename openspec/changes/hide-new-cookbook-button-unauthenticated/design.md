## Context

The cookbooks list page (`src/routes/cookbooks.tsx`) renders two create affordances unconditionally:

1. A "New Cookbook" button in the page header (lines 24–30)
2. A "Create your first cookbook" button in the empty state (lines 46–50)

Both trigger an inline `CreateCookbookForm` which calls `trpc.cookbooks.create` — a `protectedProcedure`. When an unauthenticated user clicks either button, the mutation fails with a tRPC auth error and no user-friendly feedback.

The backend `visibilityFilter` already enforces the correct data visibility (public + own private cookbooks for authenticated users; public only for guests). The fix is purely client-side.

The established pattern for this in the codebase is `src/routes/recipes/index.tsx`, which uses `useSession` from `@/lib/auth-client` to derive `isLoggedIn` and conditionally renders auth-gated UI.

## Goals / Non-Goals

**Goals:**
- Hide both create affordances from unauthenticated users
- Follow the `useSession` pattern already established in the codebase
- Maintain existing behaviour for authenticated users (no regression)

**Non-Goals:**
- Adding a sign-in prompt or CTA for unauthenticated users
- Modifying the backend
- Addressing similar gaps on other pages
- Redirecting unauthenticated users who navigate directly to a create URL

## Decisions

**Decision 1: Client-side conditional rendering via `useSession`**

Use `const { data: session } = useSession()` and `const isLoggedIn = !!session?.user` to gate both buttons — exactly matching `src/routes/recipes/index.tsx:64-65`.

*Alternatives considered:*
- **Route-level guard / loader**: Would redirect unauthenticated users away from `/cookbooks` entirely. Rejected — the page has valid public content (the cookbook list) that guests should see.
- **Disable button instead of hide**: Worse UX; a disabled button with no explanation is more confusing than no button.
- **Sign-in prompt in empty state**: Out of scope per proposal; edge case for logged-out users since public cookbooks are typically present.

**Decision 2: No loading state guard**

`useSession` returns `isPending` while the session loads. We do not suppress the buttons during the pending state (unlike the Header component, which hides auth UI during pending). Rationale: the buttons flash away quickly once the session resolves, and suppressing them during pending would add complexity for a negligible UX gain on this page.

**Proposal → Design mapping:**
| Proposal element | Design decision |
|---|---|
| Hide "New Cookbook" button | Conditional render gated on `isLoggedIn` |
| Hide empty-state create button | Same `isLoggedIn` guard |
| Follow existing pattern | `useSession` from `@/lib/auth-client` |
| No backend changes | Confirmed — visibilityFilter already correct |

## Risks / Trade-offs

- **Button flash-in for logged-in users**: `isLoggedIn` is `false` while `useSession` resolves, so buttons are hidden on initial render and appear once the session loads. Logged-out users see no flash. Low impact — acceptable per Decision 2. Mitigation: if this proves problematic, suppress buttons during `isPending` by also checking `!isPending`.
- **CI blocking policy**: If any CI check fails, investigate root cause before bypassing. Do not use `--no-verify` or skip lint/type checks.

## Open Questions

- None outstanding.
