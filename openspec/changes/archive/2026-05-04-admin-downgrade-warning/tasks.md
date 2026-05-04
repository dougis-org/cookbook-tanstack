# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b admin-downgrade-warning` then immediately `git push -u origin admin-downgrade-warning`

## Execution

### Task 1: Add downgrade warning to confirmation modal

**Files to modify:**
- `src/routes/admin/users.tsx`

**Steps:**
1. Import `TIER_RANK` from `@/types/user`
2. Compute `isDowngrade` in the modal render: `TIER_RANK[pending.fromTier] > TIER_RANK[pending.toTier]`
3. Add conditional warning block after the tier-change description paragraph and before the action buttons

**Warning block to add (between `</p>` and `<div className="flex gap-3">`):**

```tsx
{TIER_RANK[pending.fromTier] > TIER_RANK[pending.toTier] && (
  <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
    <p className="text-sm text-amber-600 dark:text-amber-400">
      ⚠️ This will make all private recipes and cookbooks public, and hide any
      content over the new tier's limit. Your oldest content is preserved first.
    </p>
  </div>
)}
```

**Verification:** Visual confirmation in browser or manual test with tier selector.

### Task 2: Add unit tests for downgrade warning visibility

**Files to modify:**
- `src/routes/admin/__tests__/users.test.tsx`

**Steps:**
1. Add test: warning visible when selecting lower tier (home-cook → prep-cook)
2. Add test: warning absent when selecting higher tier (prep-cook → sous-chef)
3. Verify existing tests still pass (confirm/cancel flow unchanged)

**Test 1 — warning visible on downgrade:**
```tsx
it('confirmation modal shows warning when downgrading tier', () => {
  render(<AdminUsersPage />)
  const aliceSelect = screen.getByLabelText('Change tier for alice@test.com')
  // home-cook (0) → prep-cook (1) is not a downgrade; use a higher tier
  // home-cook (0) → prep-cook (1) has TIER_RANK increase, not downgrade
  // To test downgrade: prep-cook (1) → home-cook (0)
  fireEvent.change(aliceSelect, { target: { value: 'home-cook' } })
  const dialog = screen.getByRole('dialog')
  expect(dialog.querySelector('.bg-amber-500/10')).toBeInTheDocument()
})
```

**Test 2 — warning absent on upgrade:**
```tsx
it('confirmation modal does not show warning when upgrading tier', () => {
  render(<AdminUsersPage />)
  const aliceSelect = screen.getByLabelText('Change tier for alice@test.com')
  // prep-cook (1) → sous-chef (2) is an upgrade (TIER_RANK increases)
  fireEvent.change(aliceSelect, { target: { value: 'sous-chef' } })
  const dialog = screen.getByRole('dialog')
  expect(dialog.querySelector('.bg-amber-500/10')).not.toBeInTheDocument()
})
```

## Validation

- [x] Run unit tests: `npm run test -- src/routes/admin/__tests__/users.test.tsx`
- [x] Run type checks: `npx tsc --noEmit`
- [x] Run lint: `npm run lint` (if available)
- [x] Verify build succeeds: `npm run build` (if available)
- [x] All completed tasks marked as complete (`- [x]`)

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test -- src/routes/admin/__tests__/users.test.tsx`; all tests must pass
- **Type checks** — `npx tsc --noEmit`; no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [x] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from working branch to `main`
- [x] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [x] Enable auto-merge: `gh pr merge <PR-URL> --auto --merge`
- [x] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [x] **Monitor CI checks** — poll for check status autonomously; when any CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until all checks pass
- [x] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user

Ownership metadata:

- Implementer: opencode agent
- Reviewer(s): human reviewer
- Required approvals: 1 (standard PR review)

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on the default branch
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Update repository documentation impacted by the change
- [x] Sync approved spec deltas into `openspec/specs/` (global spec)
- [ ] Archive the change: move `openspec/changes/admin-downgrade-warning/` to `openspec/changes/archive/YYYY-MM-DD-admin-downgrade-warning/` and stage both the new location and the deletion of the old location in a single commit
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-admin-downgrade-warning/` exists and `openspec/changes/admin-downgrade-warning/` is gone
- [ ] Commit and push the archive to the default branch in one commit
- [ ] Prune merged local feature branches: `git fetch --prune` and `git branch -d admin-downgrade-warning`