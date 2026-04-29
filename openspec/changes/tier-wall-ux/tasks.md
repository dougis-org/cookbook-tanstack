# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/tier-wall-ux` then immediately `git push -u origin feat/tier-wall-ux`

## Execution

### Task 1 — AppErrorCause type and errorFormatter

Spec: `openspec/changes/tier-wall-ux/specs/app-error-cause.md`

- [x] In `src/server/trpc/init.ts`, define and export `AppErrorCause` discriminated union:
  ```ts
  export type AppErrorCause =
    | { type: 'tier-wall'; reason: 'count-limit' | 'private-content' | 'import' }
    | { type: 'ownership' }
  ```
- [x] Add `errorFormatter` to `initTRPC.create()` that reads `error.cause`, validates it is a plain object matching `AppErrorCause`, and promotes it to `shape.data.appError` (null if absent or invalid shape)
- [x] Verify TypeScript compilation passes: `npx tsc --noEmit`

### Task 2 — Switch tier-enforcement throws to PAYMENT_REQUIRED

Spec: `openspec/changes/tier-wall-ux/specs/app-error-cause.md`

- [x] Grep for all existing `FORBIDDEN` throws across `src/server/trpc/` to identify ownership vs tier throws
- [x] In `src/server/trpc/routers/_helpers.ts`, update `enforceContentLimit` to throw `PAYMENT_REQUIRED` with `cause: { type: 'tier-wall', reason: 'count-limit' }`
- [x] In `src/server/trpc/routers/cookbooks.ts`, update the private-cookbook FORBIDDEN throw to `PAYMENT_REQUIRED` with `cause: { type: 'tier-wall', reason: 'private-content' }`
- [x] In `src/server/trpc/routers/recipes.ts`, update import/private FORBIDDEN throws to `PAYMENT_REQUIRED` with appropriate reason
- [x] Leave `verifyOwnership` FORBIDDEN and `tierProcedure` FORBIDDEN unchanged
- [x] Run affected router tests: `npx vitest run src/server/trpc/`

### Task 3 — useTierEntitlements hook

Spec: `openspec/changes/tier-wall-ux/specs/use-tier-entitlements.md`

- [x] Write tests first in `src/hooks/__tests__/useTierEntitlements.test.ts` covering all tier values and null session (home-cook fallback)
- [x] Create `src/hooks/useTierEntitlements.ts`:
  ```ts
  export function useTierEntitlements() {
    const { session } = useAuth()
    const tier = (session?.user?.tier ?? 'home-cook') as EntitlementTier
    return {
      tier,
      canCreatePrivate: canCreatePrivate(tier),
      canImport: canImport(tier),
      recipeLimit: getRecipeLimit(tier),
      cookbookLimit: getCookbookLimit(tier),
    }
  }
  ```
- [x] Run hook tests: `npx vitest run src/hooks/__tests__/useTierEntitlements.test.ts`

### Task 4 — TierWall component

Spec: `openspec/changes/tier-wall-ux/specs/tier-wall-component.md`

- [x] Write tests first in `src/components/ui/__tests__/TierWall.test.tsx` covering: both display modes, all three reason values, modal dismiss, `/pricing` link presence, null-session resilience
- [x] Create `src/components/ui/TierWall.tsx` with props `{ reason: 'count-limit' | 'private-content' | 'import', display: 'inline' | 'modal', onDismiss?: () => void }`
  - `display="inline"`: compact banner/tooltip with reason-specific text and `<Link to="/pricing">`
  - `display="modal"`: dialog overlay with reason-specific text, `/pricing` CTA, dismiss button
- [x] Run component tests: `npx vitest run src/components/ui/__tests__/TierWall.test.tsx`

### Task 5 — Pre-emptive affordances

Spec: `openspec/changes/tier-wall-ux/specs/pre-emptive-affordances.md`

- [x] Write tests first for each affordance location
- [x] On the recipes page (`src/routes/recipes/index.tsx`): use `useTierEntitlements()` + current recipe count from the list query to disable "New Recipe" button and render inline TierWall when at limit
- [x] On the cookbooks page (`src/routes/cookbooks/index.tsx`): same pattern for "New Cookbook" button using cookbook count
- [x] On recipe/cookbook create forms: hide "Set to private" toggle when `!canCreatePrivate`
- [x] On import entry point (locate via grep): hide/disable when `!canImport`, show inline TierWall with `reason="import"`
- [x] Run affordance tests: `npx vitest run src/routes/__tests__/`

### Task 6 — Client-side PAYMENT_REQUIRED catch

Spec: `openspec/changes/tier-wall-ux/specs/tier-wall-component.md`

- [x] Write tests first for mutation error handling in affected components
- [x] At each tRPC mutation call site for recipe/cookbook create and cookbook update: add `onError` handler that checks `error.data?.appError?.type === 'tier-wall'` and sets state to show `TierWall display="modal"` with the appropriate reason
- [x] Ensure generic error toast is still shown for non-tier errors
- [x] Run tests: `npx vitest run src/`

## Validation

- [x] Run unit/integration tests: `npm run test`
- [x] Run E2E tests: `npm run test:e2e`
- [x] Run type checks: `npx tsc --noEmit`
- [x] Run build: `npm run build`
- [ ] Confirm `error.data.appError` is not null in a manual test of a tier-limit hit
- [x] All completed tasks marked complete
- [x] All steps in Remote push validation pass

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test` — all tests must pass
- **Integration tests** — `npm run test` — all tests must pass
- **Regression / E2E tests** — `npm run test:e2e` — all tests must pass
- **Build** — `npm run build` — must succeed with no errors
- If **ANY** of the above fail, you **MUST** iterate and address the failure before pushing

## PR and Merge

- [ ] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [ ] Commit all changes to `feat/tier-wall-ux` and push to remote
- [ ] Open PR from `feat/tier-wall-ux` to `main` with title: `feat: add tier-wall UX and upgrade prompts (#391)`
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] Enable auto-merge: `gh pr merge --auto --merge`
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, follow all steps in Remote push validation then push; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll for check status autonomously; when any CI check fails, diagnose and fix, commit fixes, follow all steps in Remote push validation then push; wait 180 seconds then repeat until all checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user

Ownership metadata:

- Implementer: Doug Hubbard
- Reviewer(s): automated (Copilot review + Codacy)
- Required approvals: 1

Blocking resolution flow:

- CI failure → diagnose → fix → `npm run test && npm run build` → commit → push → wait 180s → re-check
- Security finding → remediate → commit → push → re-scan
- Review comment → address → commit → push → confirm resolved → wait 180s

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on the default branch
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update `src/hooks/` documentation if any hook-level comments are warranted
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec)
- [ ] Archive the change: move `openspec/changes/tier-wall-ux/` to `openspec/changes/archive/YYYY-MM-DD-tier-wall-ux/` — stage both the new location and the deletion of the old in **a single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-tier-wall-ux/` exists and `openspec/changes/tier-wall-ux/` is gone
- [ ] Commit and push the archive commit to `main`
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -d feat/tier-wall-ux`
