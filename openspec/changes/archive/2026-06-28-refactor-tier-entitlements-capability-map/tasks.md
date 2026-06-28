# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b refactor/tier-entitlements-capability-map` then immediately `git push -u origin refactor/tier-entitlements-capability-map`

## Execution

### 1. Write failing tests for `CAPABILITY_TIERS` and `can()`

TDD: add tests to `src/lib/__tests__/tier-entitlements.test.ts` that cover:
- `CAPABILITY_TIERS` deep-equals `{ createPrivate: 'sous-chef', privateRecipeNotes: 'sous-chef', import: 'executive-chef' }`
- `can('createPrivate', tier)` returns correct boolean for all five tiers + null + undefined
- `can('privateRecipeNotes', tier)` returns correct boolean for all five tiers + null + undefined
- `can('import', tier)` returns correct boolean for all five tiers

Confirm tests fail: `npx vitest run src/lib/__tests__/tier-entitlements.test.ts`

- [x] New `CAPABILITY_TIERS` test block added, failing
- [x] New `can()` test blocks added, failing

### 2. Implement `CAPABILITY_TIERS` and `can()` in `src/lib/tier-entitlements.ts`

- [x] Add `CAPABILITY_TIERS` constant (after the `UserTier` import line):
  ```ts
  export const CAPABILITY_TIERS = {
    createPrivate:      'sous-chef',
    privateRecipeNotes: 'sous-chef',
    import:             'executive-chef',
  } as const satisfies Record<string, UserTier>
  ```
- [x] Add `can()` function (before the existing `canCreatePrivate`):
  ```ts
  export function can(
    capability: keyof typeof CAPABILITY_TIERS,
    tier: string | null | undefined,
  ): boolean {
    return hasAtLeastTier({ tier }, CAPABILITY_TIERS[capability])
  }
  ```
- [x] Rewire `canCreatePrivate` → `return can('createPrivate', tier)`
- [x] Rewire `canUsePrivateRecipeNotes` → `return can('privateRecipeNotes', tier)`
- [x] Rewire `canImport` → `return can('import', tier)`
- [x] Confirm new tests pass AND all existing wrapper tests still pass:
  `npx vitest run src/lib/__tests__/tier-entitlements.test.ts`

### 3. Update `src/hooks/useTierEntitlements.ts` to use `can()` internally

- [x] Add `can` and `CAPABILITY_TIERS` to imports from `@/lib/tier-entitlements`
- [x] Replace `canCreatePrivate(tier)` → `can('createPrivate', tier)` in hook body
- [x] Replace `canUsePrivateRecipeNotes(tier)` → `can('privateRecipeNotes', tier)` in hook body
- [x] Replace `canImport(tier)` → `can('import', tier)` in hook body
- [x] Remove `canCreatePrivate`, `canUsePrivateRecipeNotes`, `canImport` from named imports (if no longer needed)
- [x] Confirm hook tests pass: `npx vitest run src/hooks/__tests__/useTierEntitlements.test.ts`

### 4. Update `docs/user-tier-feature-sets.md`

- [x] In the **Implementation** table, update the "Tier limits and boolean entitlements" row description to:
  `Tier limits, \`CAPABILITY_TIERS\` map (boolean gate source of truth), and \`can()\` helper`
- [x] Add a note under the table pointing developers to `CAPABILITY_TIERS` as the one-line addition point for new boolean capabilities

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] `npx vitest run src/lib/__tests__/tier-entitlements.test.ts` — all pass, no modifications to test file
- [x] `npx vitest run src/hooks/__tests__/useTierEntitlements.test.ts` — all pass, no modifications to test file
- [x] `npm run test` — full suite green
- [x] `npx tsc --noEmit` — no type errors
- [x] `npm run build` — build succeeds
- [x] All completed tasks marked as complete

## Remote push validation

This change includes non-`.md` files, so the **full path** applies:

- **Unit tests** — `npm run test`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- Integration and E2E tests: not required for this pure-refactor change (no new routes, DB queries, or UI flows)

If **ANY** required step fails, iterate and address before pushing.

## PR and Merge

- [x] Ensure `openspec-review-code` sub-agent was run and all findings addressed before final commit
- [ ] Commit all changes and push to `refactor/tier-entitlements-capability-map`
- [ ] Open PR: title `refactor: tier-entitlements to data-driven capability map`, body **must include** `Closes #538`
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge`
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if `CLOSED` exit and notify the user:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, push
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; address every unresolved thread, commit fixes, run validation, push, wait 180 seconds
  3. **CI check failures** — after all comments resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix failing required checks, commit, validate, push, wait 180 seconds; restart loop

Ownership metadata:

- Implementer: (agent)
- Reviewer(s): auto-merge after CI + agentic reviewers
- Required approvals: per repo ruleset

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Sync approved spec deltas into `openspec/specs/`:
  - Copy `openspec/changes/refactor-tier-entitlements-capability-map/specs/capability-map/spec.md` → `openspec/specs/capability-map/spec.md` (create dir if needed); update relative links to point to archive location
  - Copy `openspec/changes/refactor-tier-entitlements-capability-map/specs/can-helper/spec.md` → `openspec/specs/can-helper/spec.md`; update relative links
- [ ] Archive the change: move `openspec/changes/refactor-tier-entitlements-capability-map/` to `openspec/changes/archive/YYYY-MM-DD-refactor-tier-entitlements-capability-map/` **in a single atomic commit** (stage copy + delete together)
- [ ] Confirm archive exists and original directory is gone
- [ ] **Create a doc branch**: `git checkout -b doc/archive-YYYY-MM-DD-refactor-tier-entitlements-capability-map` then push
- [ ] Open a PR from the doc branch to `main` with title `docs: archive refactor-tier-entitlements-capability-map (YYYY-MM-DD)`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`
- [ ] Monitor doc PR until merged (same loop as implementation PR)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D refactor/tier-entitlements-capability-map doc/archive-YYYY-MM-DD-refactor-tier-entitlements-capability-map`
