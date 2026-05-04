# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b tier-enforcement-tests-and-docs` then immediately `git push -u origin tier-enforcement-tests-and-docs`

## Execution

### A — Enforcement contract comment in src/lib/tier-entitlements.ts

- [x] **A1** Add a block comment above `TIER_LIMITS` in `src/lib/tier-entitlements.ts` describing the three-layer enforcement contract:
  - Server enforcement lives in tRPC routers only; no logic outside this module + routers
  - Client `useTierEntitlements()` is for UI affordances only — never for access control
  - `reconcile-user-content.ts` applies limits retroactively on downgrade
  - Verify: `grep -A8 "Enforcement contract" src/lib/tier-entitlements.ts`

### B — Race tolerance comment in src/server/trpc/routers/_helpers.ts

- [x] **B1** Add an inline comment inside `enforceContentLimit` (near the count-then-create logic) noting that a +1 over-limit race window is accepted and no locking is needed
  - Verify: `grep -n "race" src/server/trpc/routers/_helpers.ts`

### C — Null-tier tests in helpers.test.ts

- [x] **C1** Add a test to `src/server/trpc/routers/__tests__/helpers.test.ts`:
  - `enforceContentLimit(userId, undefined, false, 'recipes')` with 10 existing recipes → throws `PAYMENT_REQUIRED`
  - Verify: `npx vitest run src/server/trpc/routers/__tests__/helpers.test.ts`

### D — Null-tier tests in recipes.test.ts

- [x] **D1** Add a test to the `"recipes.create — tier limit enforcement"` describe block in `src/server/trpc/routers/__tests__/recipes.test.ts`:
  - User with `tier: undefined` (omit tier in makeAuthCaller opts) with 10 existing recipes → `recipes.create` throws `PAYMENT_REQUIRED`
  - Verify: `npx vitest run src/server/trpc/routers/__tests__/recipes.test.ts`

### E — Null-tier tests in cookbooks.test.ts

- [x] **E1** Add a test to the cookbook limit describe block in `src/server/trpc/routers/__tests__/cookbooks.test.ts`:
  - User with `tier: undefined` with 1 existing cookbook → `cookbooks.create` throws `PAYMENT_REQUIRED`
  - Verify: `npx vitest run src/server/trpc/routers/__tests__/cookbooks.test.ts`

### F — Admin bypass on update in recipes.test.ts

- [x] **F1** Add a test to `src/server/trpc/routers/__tests__/recipes.test.ts` (near the visibility enforcement section):
  - Admin with `tier: 'home-cook'` calls `recipes.update` with `{ isPublic: false }` on their own recipe → succeeds
  - Verify: `npx vitest run src/server/trpc/routers/__tests__/recipes.test.ts`

### G — TierWall /pricing link assertion in -recipes.test.tsx

- [x] **G1** In `src/routes/__tests__/-recipes.test.tsx`, inside the existing test `'shows inline TierWall when home-cook user is at recipe limit'`, add:
  ```ts
  expect(screen.getByRole('link', { name: /upgrade/i })).toHaveAttribute('href', '/pricing')
  ```
  - Verify: `npx vitest run src/routes/__tests__/-recipes.test.tsx`

### H — Admin→reconcile→list integration test (new file)

- [x] **H1** Create `src/server/trpc/routers/__tests__/admin-tier-integration.test.ts` with `@vitest-environment node` and `withCleanDb`. Do NOT mock `@/db`. Scaffold the file with imports from `test-helpers` and `with-clean-db`.
- [x] **H2** Write test: user with 15 staggered-timestamp recipes, admin calls `setTier('home-cook')`, then `recipes.list` returns exactly 10
- [x] **H3** Write test: same user then admin calls `setTier('executive-chef')`, then `recipes.list` returns all 15
- [x] **H4** Write test: after downgrade to home-cook, verify the 5 newest recipes have `hiddenByTier: true` in the DB (direct Mongoose query, not list)
- [x] **H5** Verify all integration tests pass: `npx vitest run src/server/trpc/routers/__tests__/admin-tier-integration.test.ts`

### I — Documentation update: docs/user-tier-feature-sets.md

- [x] **I1** Replace the "Implementation Planning Output" section in `docs/user-tier-feature-sets.md` with an "Implementation" section containing a table:

  | Enforcement Area | File |
  |---|---|
  | Tier limits and boolean entitlements | `src/lib/tier-entitlements.ts` |
  | Client-side tier hook | `src/hooks/useTierEntitlements.ts` |
  | Recipe count + private enforcement | `src/server/trpc/routers/recipes.ts` |
  | Cookbook count + private enforcement | `src/server/trpc/routers/cookbooks.ts` |
  | Visibility filter (hiddenByTier) | `src/server/trpc/routers/_helpers.ts` |
  | Downgrade/upgrade reconciliation | `src/lib/reconcile-user-content.ts` |
  | Admin tier change entry point | `src/server/trpc/routers/admin.ts` |
  | Tier-wall UI | `src/components/ui/TierWall.tsx` |

  - Verify each path exists: `for f in src/lib/tier-entitlements.ts src/hooks/useTierEntitlements.ts src/server/trpc/routers/recipes.ts src/server/trpc/routers/cookbooks.ts src/server/trpc/routers/_helpers.ts src/lib/reconcile-user-content.ts src/server/trpc/routers/admin.ts src/components/ui/TierWall.tsx; do [ -f "$f" ] && echo "OK: $f" || echo "MISSING: $f"; done`

## Validation

- [x] Run full test suite: `npm run test`
- [x] Run type check: `npx tsc --noEmit`
- [x] Run build: `npm run build`
- [x] All new tests pass (C1, D1, E1, F1, G1, H2–H4)
- [x] All existing tests continue to pass (no regressions)
- [x] All file paths in the docs Implementation table verified to exist

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test` — all tests must pass
- **Integration tests** — included in `npm run test`
- **Build** — `npm run build` — must succeed with no errors
- **Type check** — `npx tsc --noEmit` — must produce no errors
- If **ANY** of the above fail, iterate and address the failure before pushing

## PR and Merge

- [x] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [x] Commit all changes to `tier-enforcement-tests-and-docs` branch and push to remote
- [x] Open PR from `tier-enforcement-tests-and-docs` to `main`
  - Title: `test(tier): add integration tests, edge cases, and documentation for #394`
  - Body: reference issue #394, summarise the 8 work items
- [x] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [x] Enable auto-merge: `gh pr merge --auto --merge`
- [x] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [x] **Monitor CI checks** — poll for check status autonomously; when any CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until all checks pass
- [x] **Poll for merge** — after each iteration run `gh pr view --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user

Ownership metadata:

- Implementer: Doug Hubbard
- Reviewer(s): automated (agentic reviewers) + human final
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → `npm run test && npm run build && npx tsc --noEmit` → push → re-run checks
- Security finding → remediate → commit → validate → push → re-scan
- Review comment → address → commit → validate → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on main
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Close GitHub issue #394
- [x] Sync approved spec deltas into `openspec/specs/` (global spec) if applicable
- [x] Archive the change: move `openspec/changes/tier-enforcement-tests-and-docs/` to `openspec/changes/archive/YYYY-MM-DD-tier-enforcement-tests-and-docs/` **in a single atomic commit** (stage both the new location and the deletion of the old location together)
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-tier-enforcement-tests-and-docs/` exists and `openspec/changes/tier-enforcement-tests-and-docs/` is gone
- [x] Commit and push the archive to main in one commit
- [x] Prune merged local feature branches: `git fetch --prune` and `git branch -d tier-enforcement-tests-and-docs`
