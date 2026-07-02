## Context

- Relevant architecture: TanStack Start file-based routing; tRPC over `@tanstack/react-query`; Tailwind 4 with `var(--theme-*)` design tokens; `useTierEntitlements()` as the single source of truth for feature gating.
- Dependencies:
  - `src/server/trpc/routers/privateRecipeNotes.ts` — backend procedures (`get`, `upsert`) are complete and merged.
  - `src/hooks/useTierEntitlements.ts` — exposes `canUsePrivateRecipeNotes: boolean`.
  - `src/hooks/useAuth.ts` — exposes `isLoggedIn`.
  - `src/lib/trpc.ts` — tRPC client (`trpc.privateRecipeNotes.get.queryOptions`, `trpc.privateRecipeNotes.upsert.mutationOptions`).
  - `lucide-react` — `Pencil`, `Save`, `X` icons.
- Interfaces/contracts touched:
  - `privateRecipeNotes.get({ recipeId })` → `{ hasNote: boolean, note: { body: string, updatedAt: Date } | null }`
  - `privateRecipeNotes.upsert({ recipeId, body })` → `{ success: true }`
  - `src/routes/recipes/$recipeId.tsx` — receives `<PrivateRecipeNotes recipeId={recipeId} />` insertion.

## Goals / Non-Goals

### Goals

- Self-contained component that manages its own query/mutation state
- Smooth optimistic update with rollback on failure
- All four themes render legibly (uses only `var(--theme-*)` tokens)
- Full RTL test coverage per issue acceptance criteria

### Non-Goals

- Markdown parsing or rendering
- Toast notification system
- Delete note affordance
- Upgrade nudge for ineligible tiers

## Decisions

### Decision 1: Rendering format for note body

- Chosen: `whitespace-pre-wrap` plain text (same as the existing public `notes` field in `RecipeDetail`)
- Alternatives considered: `react-markdown` library; custom regex-based markdown
- Rationale: No markdown library exists in the project; adding one for a single component creates a dependency for marginal gain. Consistency with the existing notes field is more important than markdown rendering for an MVP.
- Trade-offs: Users who write markdown syntax see asterisks/hashes as literal characters in read mode. Acceptable at this stage; can be upgraded later without changing the data model or API.

### Decision 2: Error display on save failure

- Chosen: Inline `useState` error string rendered below the Save/Cancel controls inside the card
- Alternatives considered: `sonner` toast library
- Rationale: No toast library exists; adding one is out of scope. Inline errors are the established pattern in auth forms (`ResetPasswordForm`, `ForgotPasswordForm`, `RegisterForm`). The error is visually adjacent to the action that caused it.
- Trade-offs: Less visible if user scrolls the card off screen, but the edit panel is self-contained and unlikely to be below the fold.

### Decision 3: Component visibility for ineligible users

- Chosen: Return `null` immediately when `!canUsePrivateRecipeNotes` (no query fired, no UI rendered)
- Alternatives considered: Render a locked/teaser state; show the upgrade nudge
- Rationale: Upgrade nudge is explicitly out of scope per issue. Firing the query for users who can't read the result wastes a round-trip.
- Trade-offs: Lower-tier users get no signal that the feature exists. Acceptable — the entitlement tier page is the discovery surface for that.

### Decision 4: Optimistic update strategy

- Chosen: On `upsert` mutate call, immediately write `{ hasNote: true, note: { body: editBody, updatedAt: new Date() } }` into the query cache via `queryClient.setQueryData`. On error, roll back to the snapshot captured before the mutation. Invalidate the query on both success and error to re-sync with the server.
- Alternatives considered: No optimistic update (wait for server round-trip); invalidate-only on success
- Rationale: Optimistic updates are required by the issue acceptance criteria. The `useQuery` queryKey is `trpc.privateRecipeNotes.get.queryOptions({ recipeId }).queryKey` — stable and independent of the recipes cache.
- Trade-offs: `updatedAt` in the optimistic snapshot is a client-side approximation; corrected on re-fetch.

### Decision 5: Component placement in route

- Chosen: Between `<RecipeDetail>` and the `<div className="mt-8 flex ...">` action buttons in `src/routes/recipes/$recipeId.tsx`
- Alternatives considered: After the action buttons; inside `RecipeDetail` as a prop
- Rationale: Notes logically belong to the recipe content, not the action bar. Keeping it outside `RecipeDetail` avoids coupling the display component to auth/tier logic. The `mt-8` buttons section anchors the bottom of the recipe content area.
- Trade-offs: One extra import and JSX line in the route file; negligible.

## Proposal to Design Mapping

- Proposal element: No new npm dependencies
  - Design decision: Decision 1 (whitespace-pre-wrap), Decision 2 (inline error)
  - Validation approach: `package.json` diff must show no new dependencies

- Proposal element: `var(--theme-*)` tokens only
  - Design decision: All className strings in the component reference only `var(--theme-*)` or taxonomy badge exceptions; no hard-coded slate/cyan hex
  - Validation approach: Visual review across all four themes; grep for hex values in new file

- Proposal element: Optimistic update with rollback
  - Design decision: Decision 4
  - Validation approach: RTL test mocking mutation failure confirms rollback

- Proposal element: Tier gating via `useTierEntitlements()`
  - Design decision: Decision 3
  - Validation approach: RTL test with mocked `canUsePrivateRecipeNotes: false` confirms null render; no query fired

## Functional Requirements Mapping

- Requirement: Empty state shows "Add a note" affordance
  - Design element: Conditional render when `data.note === null && !data.hasNote` (or `data === undefined` after load)
  - Acceptance criteria reference: Issue #495 — "Empty state offers an 'Add a note' affordance"
  - Testability notes: RTL — render with mocked `get` returning `{ hasNote: false, note: null }`, assert affordance text visible

- Requirement: Click-to-edit toggles textarea with character counter and Save / Cancel
  - Design element: `isEditing` boolean state; controlled `editBody` string; counter rendered as `{editBody.length} / 10000`
  - Acceptance criteria reference: Issue #495 — "Click-to-edit toggles a markdown textarea with a visible character counter"
  - Testability notes: RTL — click edit/add button, assert textarea appears, type text, assert counter updates

- Requirement: Save calls upsert with optimistic update; Cancel reverts
  - Design element: Decision 4; Cancel sets `editBody` back to `data.note?.body ?? ''` and `isEditing` to false
  - Acceptance criteria reference: Issue #495 — "Save calls `privateRecipeNotes.upsert` with optimistic update; Cancel reverts"
  - Testability notes: RTL — mock upsert mutation, fire Save, assert optimistic state; fire Cancel, assert textarea gone and body unchanged

- Requirement: Save disabled while pending or body unchanged
  - Design element: `disabled={upsertMutation.isPending || editBody === (data?.note?.body ?? '')}`
  - Acceptance criteria reference: Issue #495 — "disabled Save while pending and when body unchanged"
  - Testability notes: RTL — assert Save button disabled initially; assert enabled after typing; assert disabled while mutation pending

- Requirement: Loading skeleton
  - Design element: Render a placeholder div with `animate-pulse` when `isLoading`
  - Acceptance criteria reference: Issue #495 — "Loading skeleton"
  - Testability notes: RTL — mock query in loading state, assert skeleton element present

- Requirement: Error message on save failure
  - Design element: `saveError` useState string; rendered as `<p className="text-red-500">` below controls
  - Acceptance criteria reference: Issue #495 — "error toast on save failure" (implemented as inline error per user decision)
  - Testability notes: RTL — mock mutation rejection, fire Save, assert error text visible

## Non-Functional Requirements Mapping

- Requirement category: accessibility
  - Requirement: Textarea and buttons have descriptive labels
  - Design element: `aria-label` on icon-only buttons (Pencil edit, Save, Cancel); textarea `id` + `htmlFor` label pairing
  - Acceptance criteria reference: Design system CLAUDE.md — no specific rule, general practice
  - Testability notes: RTL queries by role/label; no explicit a11y test added but RTL default behavior validates basic labeling

- Requirement category: performance
  - Requirement: No query fired for ineligible users
  - Design element: Decision 3 — early return before `useQuery` (hooks rules: `useQuery` is called unconditionally but `enabled` flag is set to `canUsePrivateRecipeNotes && isLoggedIn`)
  - Acceptance criteria reference: React hooks rules prohibit conditional hook calls; use `enabled` option instead
  - Testability notes: RTL — mock trpc, assert query not called when `canUsePrivateRecipeNotes` is false

- Requirement category: security
  - Requirement: No client-side tier enforcement beyond display gating
  - Design element: Server enforces tier on every mutation via `tierProcedure("sous-chef")`; client merely hides the UI
  - Acceptance criteria reference: Project convention — centralized tier checks in shared policy code
  - Testability notes: Covered by router integration tests (existing, #492)

## Risks / Trade-offs

- Risk/trade-off: React hooks rules — `useQuery` cannot be called conditionally
  - Impact: Must call `useQuery` unconditionally and use `enabled: canUsePrivateRecipeNotes && isLoggedIn` to suppress the network request
  - Mitigation: Standard pattern per TanStack Query docs; `enabled: false` returns `{ data: undefined, isLoading: false }`

- Risk/trade-off: Optimistic `updatedAt` is a client-side approximation
  - Impact: Minor timestamp inaccuracy visible in UI until re-fetch completes
  - Mitigation: Acceptable; component does not display `updatedAt` in the current design

## Rollback / Mitigation

- Rollback trigger: Save failure surface-visible to users; query returning stale data after optimistic rollback
- Rollback steps: Revert `src/components/recipes/PrivateRecipeNotes.tsx`, remove import and JSX from `$recipeId.tsx`. No DB migration needed — backend is unchanged.
- Data migration considerations: None. Backend and data model are unaffected by this PR.
- Verification after rollback: Recipe detail page loads without the notes panel; no JS errors.

## Operational Blocking Policy

- If CI checks fail: Fix the failure before requesting review. Do not merge with failing tests or type errors.
- If security checks fail: Treat as a blocker. No merge until Codacy/Snyk findings addressed or documented as false positives.
- If required reviews are blocked/stale: Wait up to 24 hours, then re-request review or ping in PR comments.
- Escalation path and timeout: If auto-merge does not trigger within 48 hours of all checks passing, manually inspect required check status and resolve thread blocking.

## Open Questions

No open questions. All design decisions are resolved.
