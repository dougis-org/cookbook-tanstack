## Context

- Relevant architecture: TanStack Start app, file-based routing (`src/routes/`),
  tRPC routers under `src/server/trpc/routers/`, React components under
  `src/components/`. Account page composes independent `*Section` components.
  Design-system rules live in `design-system/CLAUDE.md`.
- Dependencies: `sharing.ts` router (`shareLibrary`, `revokeLibraryShare`,
  `myLibraryShares`, `mySharedLibraries`) and `cookbooks.ts` router
  (`myCollaborations`), all merged. `users.search` (merged, used today by
  `InviteCollaboratorModal` in `src/routes/cookbooks.$cookbookId.tsx`).
- Interfaces/contracts touched: none server-side. New frontend consumer of five
  existing tRPC procedures. New Playwright helper(s) in `src/e2e/helpers/app.ts`.

## Goals / Non-Goals

### Goals

- Make library sharing reachable: a single account-page section to grant, list,
  and revoke shares, and to see shares/collaborations received.
- Keep the three lists' data boundaries exactly as the merged routers already
  define them — no new aggregation logic.
- Ship a correct, tested gating matrix for Executive-Chef vs. non-Executive-Chef
  visibility of the "I share" capability.
- Fix the one `networkidle` wait this change's own E2E spec is modeled on, so new
  test code doesn't copy a known-bad pattern.

### Non-Goals

- Optimistic UI with rollback (→ #688).
- Sweeping all other E2E specs for `networkidle` (→ #689).
- Any change to collaborator role semantics, server-side sharing logic, or print
  handling.

## Decisions

### Decision 1: `SharingSection` composed of three independent list widgets

- Chosen: One `SharingSection.tsx` component containing three sibling sub-views —
  `SharesIGiveList`, `SharedWithMeList`, `MyCollaborationsList` — each backed by its
  own `useQuery` against `sharing.myLibraryShares`, `sharing.mySharedLibraries`, and
  `cookbooks.myCollaborations` respectively. Exported default is the composed
  section; sub-views are internal (not separately exported), matching
  `PreferencesSection`'s internal-subcomponent style.
- Alternatives considered: One combined query/view merging all three lists; three
  fully separate top-level components.
- Rationale: The three lists have different data shapes, different owners
  (sharing vs. collaboration subsystems), and different gating rules (Decision 2).
  Keeping them as independent widgets inside one section avoids a combined loading/
  error state across unrelated data, and mirrors how `ProfileSection`/
  `PreferencesSection` already independently fetch their own data.
- Trade-offs: Three separate network requests on account-page load instead of one.
  Acceptable — this page is not latency-sensitive and the existing account section
  components already each fetch independently.

### Decision 2: Three-way gating matrix, computed from `mySharedLibraries` +
`myCollaborations` results already in hand

- Chosen:

  | Caller state                                   | "I share" list + invite | "Shared with me" list | "My collaborations" list | Upgrade affordance |
  |-------------------------------------------------|:---:|:---:|:---:|:---:|
  | Executive Chef                                   | shown, full UI | shown | shown | no |
  | Non-Exec-Chef, `mySharedLibraries` or `myCollaborations` non-empty | hidden entirely (no empty state, no CTA) | shown | shown | no |
  | Non-Exec-Chef, both empty                        | hidden entirely | hidden (empty, so nothing to show) | hidden (empty, so nothing to show) | yes, `.up-*` classed |

  Tier is read from the existing session/user-tier context already used elsewhere
  in `src/components/account/` (same source `StatusSection`/`PreferencesSection`
  use — no new tier-fetching logic). The "has anything shared with them" condition
  is simply `mySharedLibraries.length > 0 || myCollaborations.length > 0`, derived
  from data the section already fetches for its other two lists — no new query.
- Alternatives considered: Show the "I share" list with an inline disabled state
  plus upsell copy for non-Exec-Chef users, rather than hiding it outright.
- Rationale: Per the issue's TDD list ("Section hidden or shows an upgrade
  affordance for non-executive-chef users with no received shares"), hiding is the
  specified behavior when there's nothing to show; showing a disabled "I share"
  list with zero rows for every non-Exec-Chef user needlessly dead-ends the page
  with a feature they can't use. When they *do* have received shares, the other
  two lists justify the section's presence on their own, and the "I share"
  affordance simply isn't relevant to them (they didn't buy the capability).
- Trade-offs: A non-Exec-Chef user with received shares sees no path to upgrade on
  this page (only free users with literally nothing shared see the upsell). This
  is accepted because the upgrade affordance's job (per the issue) is specifically
  to surface the capability to someone with no other reason to see this section at
  all — a user who already benefits from being a *recipient* doesn't need the same
  nudge repeated.

### Decision 3: Invite flow is a single-field search-and-select, not a modal with
role selection

- Chosen: An inline (non-modal) search input backed by `trpc.users.search`,
  debounced identically to `InviteCollaboratorModal` (400ms, 2-char minimum),
  rendering a result list; selecting a result immediately calls
  `sharing.shareLibrary`. No role selector — a library share has exactly one
  shape (full read access), unlike a cookbook collaborator's editor/viewer choice.
- Alternatives considered: Reuse `InviteCollaboratorModal` as a modal, with the
  role fieldset removed; a two-step "search then confirm" flow.
- Rationale: Modeling the *interaction pattern* (debounced search against
  `users.search`, select-from-list) without the *chrome* (modal, role radio) keeps
  the account page's inline, non-modal section style (matching
  `PreferencesSection`'s inline editing) and avoids presenting a dead-looking role
  fieldset for a feature that has no roles.
- Trade-offs: Divergent visual pattern from `InviteCollaboratorModal` for a
  conceptually similar action. Documented here explicitly (see proposal.md Risks)
  so it isn't mistaken for an inconsistency bug later.

### Decision 4: Pending-state UI, not optimistic UI, for invite/revoke

- Chosen: `shareLibrary`/`revokeLibraryShare` mutations use `useMutation` with
  `onSuccess: () => queryClient.invalidateQueries(...)` and `onError` setting a
  visible inline error message. The acting control (invite button / revoke button)
  is `disabled` and shows a pending label (`"Sharing…"` / `"Revoking…"`) while
  `mutation.isPending`. No `onMutate` cache mutation, no rollback.
- Alternatives considered: True optimistic UI with `onMutate` snapshot + `onError`
  rollback, per the issue's original TDD wording ("a failed mutation reverts
  optimistic UI").
- Rationale: No mutation anywhere in this codebase currently implements real
  optimistic-UI-with-rollback (confirmed: `cookbooks.addCollaborator`/
  `removeCollaborator` are plain invalidate-on-success). Introducing that pattern
  for the first time inside this already-multi-part PR adds meaningfully higher
  risk (cache snapshot correctness, race with the three independent list queries)
  for a UX gain (perceived latency) that a disabled+pending control captures most
  of. The user agreed to defer true optimistic UI to #688.
- Trade-offs: Slightly less snappy than instant optimistic feedback. The TDD
  requirement "a failed mutation reverts optimistic UI" is satisfied in spirit —
  on failure there is nothing optimistic to revert, because nothing was
  speculatively applied; the pending state simply clears and the error shows.

### Decision 5: Fix `cookbooks-collaboration.spec.ts`'s `networkidle` wait as part
of this change

- Chosen: `inviteCollaborator()` in `src/e2e/cookbooks-collaboration.spec.ts`
  currently calls `page.waitForLoadState("networkidle")` twice. This change
  replaces both calls with the appropriate hydration/readiness helper from
  `src/e2e/helpers/app.ts` (e.g. `waitForHydration`, or a retrying
  `expect(...).toBeVisible()` on the resulting state, per the existing "retry
  assertions for data fetched independently of hydration" convention).
- Alternatives considered: Leave the existing file untouched and let the new
  sharing E2E spec simply avoid `networkidle` itself (per #689's broader scope).
- Rationale: The new sharing spec (Decision 6) models its two-user interaction
  directly on this file's `setupOwnerAndCollaborator`/`inviteCollaborator`
  pattern. Copying a pattern that itself violates the project's no-`networkidle`
  rule would launder the anti-pattern into new code under the guise of reuse.
  Fixing it at the source is cheaper than fixing it twice later.
- Trade-offs: Slightly widens this PR's diff beyond new files. Scoped narrowly to
  the two `networkidle` call sites in this one file — the broader sweep of every
  other spec stays in #689.

### Decision 6: Genuine two-`BrowserContext` E2E scaffolding

- Chosen: The new sharing E2E spec uses `test.describe` with two real
  `browser.newContext()` instances (owner, recipient), each with its own `Page`,
  authenticated concurrently — not the sequential cookie-clear-and-relogin pattern
  `cookbooks-collaboration.spec.ts` uses today. A new helper,
  `waitForContextToReflect` (name TBD at implementation time), is added to
  `src/e2e/helpers/app.ts` to poll a second context's page for a condition (e.g.
  "badge appears" / "entry becomes unavailable") using retrying Playwright
  expectations, never `networkidle` or fixed sleeps, consistent with the project's
  existing hydration/readiness conventions.
- Alternatives considered: Reuse the sequential single-page pattern, accepting
  that "owner revokes → recipient sees it" would require a manual reload/relogin
  step rather than two live sessions.
- Rationale: The issue explicitly specifies "Playwright, two browser contexts" and
  a round trip that depends on one user's action being visible to the other
  without a relogin — that requires actual concurrency, which the existing
  sequential pattern cannot express.
- Trade-offs: This is new test infrastructure with no existing precedent in this
  repo to copy from; higher initial authoring risk, mitigated by building the
  cross-context wait as a reusable helper (which #689 can then also use when it
  touches other specs) rather than inlining it in the spec file.

## Proposal to Design Mapping

- Proposal element: `SharingSection` component, three lists
  - Design decision: Decision 1
  - Validation approach: Component tests per list (data present, empty state).
- Proposal element: Gating for non-Executive-Chef users
  - Design decision: Decision 2
  - Validation approach: Component tests for all three matrix rows in the Decision
    2 table.
- Proposal element: Invite and revoke flows
  - Design decision: Decision 3, Decision 4
  - Validation approach: Component tests — search invokes `users.search`; select
    creates a grant; revoke removes a grant; failed mutation shows an error and
    returns the control to its enabled state.
- Proposal element: Fix `cookbooks-collaboration.spec.ts` `networkidle` gap
  - Design decision: Decision 5
  - Validation approach: `npm run test:e2e -- cookbooks-collaboration` passes
    without the removed `networkidle` calls; no behavior change asserted.
- Proposal element: Two-browser-context E2E round trip
  - Design decision: Decision 6
  - Validation approach: New Playwright spec; `npm run test:e2e` green, including
    the tier-downgrade-suspends-shares scenario.

## Functional Requirements Mapping

- Requirement: An Executive Chef can see every grant they've made and revoke any
  of them.
  - Design element: Decision 1 (`SharesIGiveList`), `sharing.myLibraryShares` /
    `sharing.revokeLibraryShare`.
  - Acceptance criteria reference: `specs/library-sharing/spec.md` — "Managing
    shares".
  - Testability notes: Component test seeding multiple grants; assert all listed
    with recipient name + date; assert revoke removes one and leaves others.
- Requirement: Any user can see libraries shared with them and their existing
  cookbook collaborations in one place.
  - Design element: Decision 1 (`SharedWithMeList`, `MyCollaborationsList`).
  - Acceptance criteria reference: "Managing shares".
  - Testability notes: Component tests with seeded `mySharedLibraries` /
    `myCollaborations` responses; assert owner/cookbook names render and link
    correctly (collaborations link to the cookbook).
- Requirement: Non-Executive-Chef users see an upgrade affordance only when they
  have nothing shared with them.
  - Design element: Decision 2.
  - Acceptance criteria reference: "Managing shares" (gating sub-case).
  - Testability notes: Three component tests, one per matrix row in Decision 2.
- Requirement: Inviting a recipient uses the same search interaction as
  Collaboration, without role selection.
  - Design element: Decision 3.
  - Acceptance criteria reference: "Managing shares".
  - Testability notes: Component test — typing invokes `users.search` with the
    debounced query; selecting a result calls `shareLibrary` with the selected
    recipient id.
- Requirement: A failed invite or revoke surfaces an error without leaving stale
  pending UI.
  - Design element: Decision 4.
  - Acceptance criteria reference: "Managing shares".
  - Testability notes: Component test forcing a mutation error; assert error
    message renders and the control returns to its enabled state.
- Requirement: Scope-warning copy states the grant covers the entire library,
  including future private content.
  - Design element: Static copy in the invite UI (Decision 3's component).
  - Acceptance criteria reference: "Managing shares".
  - Testability notes: Component test asserting the exact copy string renders
    adjacent to the invite control.
- Requirement: Full owner-to-recipient round trip works end-to-end, concurrently.
  - Design element: Decision 6.
  - Acceptance criteria reference: "Recipient visibility", "Adding shared recipes
    to own cookbooks", "Revoking a share", "Unavailable shared entries".
  - Testability notes: New Playwright spec, two contexts, hydration-marker waits
    throughout (no `networkidle`).
- Requirement: Owner tier downgrade suspends all their shares immediately,
  observable from the recipient's next page load.
  - Design element: Decision 6 (same spec, second scenario). Server-side
    enforcement already covered by the parent change's design.md Decision 2 —
    this is UI/E2E confirmation only.
  - Acceptance criteria reference: "Tier downgrade suspends shares".
  - Testability notes: E2E test mutates owner tier directly in the DB (per parent
    change's existing test convention), then asserts the recipient's reload shows
    no shared content.

## Non-Functional Requirements Mapping

- Requirement category: reliability (test platform)
  - Requirement: New and touched E2E tests must not use `networkidle` or fixed
    sleeps.
  - Design element: Decision 5, Decision 6.
  - Acceptance criteria reference: project E2E wait convention
    (`src/e2e/helpers/app.ts`).
  - Testability notes: Code review / grep check (`grep -n "networkidle\|waitForTimeout"`)
    over the touched files as part of this change's own validation, confirming
    zero hits in both the new spec and the fixed lines of
    `cookbooks-collaboration.spec.ts`.
- Requirement category: accessibility / design-system compliance
  - Requirement: Section legible in all four themes; no hard-coded hex; Lucide
    icons only; no emoji; Title Case CTAs / sentence-case body; `.up-*` classnames
    on the upgrade affordance.
  - Design element: Decision 1–3's components, Decision 2's upgrade affordance.
  - Acceptance criteria reference: `design-system/CLAUDE.md` "What done looks
    like" checklist.
  - Testability notes: Manual four-theme toggle check (per `design-system/
    CLAUDE.md`); grep for hex literals and `.ad-*`/`.promo-*`/`.sponsor-*` prefixes
    in the new file.
- Requirement category: security
  - Requirement: Client-side gating (Decision 2) is presentation only; the server
    already rejects unauthorized `shareLibrary`/`revokeLibraryShare` calls
    (`execChefProcedure`, ownership check on revoke).
  - Design element: No new server trust boundary introduced.
  - Acceptance criteria reference: parent change's design.md Decision 4/6
    (unchanged).
  - Testability notes: No new server test needed; existing router tests already
    cover `FORBIDDEN` cases.

## Risks / Trade-offs

See proposal.md "Risks" — all four risks there map 1:1 to Decisions 3, 2, 6, and 4
respectively and are not repeated here.

## Rollback / Mitigation

- Rollback trigger: A production incident traced to `SharingSection` (e.g. a
  gating-matrix bug exposing the "I share" invite affordance to non-Executive-Chef
  users, or a revoke that doesn't take effect) and no fast forward-fix available.
- Rollback steps: Revert the single PR for this change (new component + route
  wiring + test files are additive and isolated; `account.tsx`'s diff is a single
  import + render line). No server or schema changes to roll back. No data
  migration involved — `LibraryShare` rows are untouched by this change.
- Data migration considerations: None. This change touches no models, no schema,
  no server routers.
- Verification after rollback: `npm run build` and `npx tsc --noEmit` pass;
  `/account` renders the three pre-existing sections as before; no residual
  references to `SharingSection` remain in `account.tsx`.

## Operational Blocking Policy

- If CI checks fail: Fix the underlying issue before merge; do not skip hooks or
  disable checks to force a merge, per project-wide policy
  (`CLAUDE.md` quality-gate section).
- If security checks fail (Codacy/Snyk, per `.github/instructions/`): Findings
  touching any file this change adds or edits are blocking and must be fixed, not
  waived, absent an explicit human-accepted-risk citation
  (`verify waive` with a cited source, per `CLAUDE.md`).
- If required reviews are blocked/stale: Follow the parent epic's established
  pattern — bounded polling with a timeout (per the project's "Bound PR review
  waits with polling and a timeout" convention) rather than blocking indefinitely
  on a `/code-review` or human review cycle.
- Escalation path and timeout: If the two-context E2E spec (Decision 6) proves
  flaky after a reasonable debugging pass (a few CI runs), stop and raise it with
  the requester rather than silently loosening its waits back toward
  `networkidle`/sleeps — that would reintroduce exactly what #689 exists to
  eliminate project-wide.

## Open Questions

None. All ambiguity from the `/opsx:explore` session was resolved with the
requester before this proposal/design was written (see proposal.md "Open
Questions").
