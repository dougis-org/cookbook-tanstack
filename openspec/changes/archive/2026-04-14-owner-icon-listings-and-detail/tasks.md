# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/owner-icon-listings-and-detail` then immediately `git push -u origin feat/owner-icon-listings-and-detail`

## Execution

### Backend

- [x] **Task 3 — `cookbooks.list`: add `userId` to response**
  - File: `src/server/trpc/routers/cookbooks.ts`
  - In the `list` handler's `.map()`, add `userId: (cb.userId?.toString() ?? null) as string | null`
  - Verify: tRPC type-checks pass (`npm run build`)

- [x] **Task 4 — `recipes.list`: make `userId` explicit in response**
  - File: `src/server/trpc/routers/recipes.ts`
  - In the `list` handler's `items` map, add explicit `userId: r.userId?.toString() ?? null` (no longer relying on `...r` spread for this field)
  - Verify: tRPC type-checks pass (`npm run build`)

### Components

- [x] **Task 5 — `RecipeCard`: add `isOwner` prop and render `User` icon**
  - File: `src/components/recipes/RecipeCard.tsx`
  - Add `isOwner?: boolean` to `RecipeCardProps`
  - Import `User` from `lucide-react`
  - In the top-right flex group (alongside `Heart`), render before `Heart`:
    ```tsx
    {isOwner && (
      <User
        className="w-4 h-4 shrink-0 ml-2 mt-1 text-[var(--theme-accent)] print:hidden"
        role="img"
        aria-label="You own this"
      />
    )}
    ```
  - Verify: component renders icon when `isOwner={true}`, absent when `false` or undefined

- [x] **Task 6 — `CookbookCard`: add `isOwner` prop and render `User` icon**
  - File: `src/components/cookbooks/CookbookCard.tsx`
  - Add `isOwner?: boolean` to the cookbook prop interface
  - Import `User` from `lucide-react`
  - In the bottom row `flex items-center justify-between`, add the icon on the left side of that row (alongside recipe count text):
    ```tsx
    {isOwner && (
      <User
        className="w-4 h-4 shrink-0 text-[var(--theme-accent)] print:hidden"
        role="img"
        aria-label="You own this"
      />
    )}
    ```
  - Verify: component renders icon when `isOwner={true}`, absent when `false` or undefined

### Listing Pages

- [x] **Task 7 — `recipes/index.tsx`: compute and pass `isOwner` to `RecipeCard`**
  - File: `src/routes/recipes/index.tsx`
  - In the recipe grid map, change:
    ```tsx
    <RecipeCard recipe={recipe} marked={isLoggedIn ? recipe.marked : undefined} />
    ```
    to:
    ```tsx
    <RecipeCard
      recipe={recipe}
      marked={isLoggedIn ? recipe.marked : undefined}
      isOwner={isLoggedIn && recipe.userId === userId}
    />
    ```
  - Verify: TypeScript accepts the new prop; `userId` is now typed from the explicit router mapping

- [x] **Task 8 — `cookbooks/index.tsx`: compute and pass `isOwner` to `CookbookCard`**
  - File: `src/routes/cookbooks/index.tsx`
  - Destructure `userId` from `useAuth()` (it's already imported; add `userId` to the destructure)
  - In the cookbook grid map, change:
    ```tsx
    <CookbookCard cookbook={{ ...cb, description: cb.description ?? null, imageUrl: cb.imageUrl ?? null }} />
    ```
    to:
    ```tsx
    <CookbookCard
      cookbook={{ ...cb, description: cb.description ?? null, imageUrl: cb.imageUrl ?? null }}
      isOwner={isLoggedIn && cb.userId === userId}
    />
    ```
  - Verify: TypeScript accepts the new prop

### Detail Pages

- [x] **Task 9 — `recipes/$recipeId.tsx`: add `User` icon to detail page header**
  - File: `src/routes/recipes/$recipeId.tsx`
  - Import `User` from `lucide-react`
  - In the `mb-6 flex items-center justify-between` bar, replace the empty `<span />` on the left with:
    ```tsx
    {isLoggedIn && isOwner ? (
      <User
        className="w-5 h-5 text-[var(--theme-accent)] print:hidden"
        role="img"
        aria-label="You own this"
      />
    ) : (
      <span />
    )}
    ```
  - Verify: icon appears for owner, absent for non-owner and logged-out

- [x] **Task 10 — `cookbooks/$cookbookId.tsx`: add `User` icon to cookbook detail header**
  - File: `src/routes/cookbooks/$cookbookId.tsx`
  - Import `User` from `lucide-react` (add to existing import line)
  - Locate the cookbook title/header section and add, adjacent to the title:
    ```tsx
    {isOwner && (
      <User
        className="w-5 h-5 text-[var(--theme-accent)] print:hidden"
        role="img"
        aria-label="You own this"
      />
    )}
    ```
  - Verify: icon appears for owner, absent for non-owner

## Validation

- [x] Run unit/integration tests: `npm run test`
- [x] Run E2E tests: `npm run test:e2e`
- [x] Run type check / build: `npm run build`
- [x] Manually verify in browser:
  - [x] Owner's recipe cards show `User` icon; others' do not
  - [x] Owner's cookbook cards show `User` icon; others' do not
  - [x] Recipe detail page shows icon for owner, absent for non-owner
  - [x] Cookbook detail page shows icon for owner, absent for non-owner
  - [x] Logged-out: no icons anywhere
  - [x] Print preview: no icons visible
- [x] All completed tasks marked as complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test`; all tests must pass
- **E2E tests** — `npm run test:e2e`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors

If **ANY** of the above fail, diagnose and fix before pushing.

## PR and Merge

- [x] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [x] Commit all changes to `feat/owner-icon-listings-and-detail` and push to remote
- [x] Open PR from `feat/owner-icon-listings-and-detail` to `main`; enable auto-merge
- [x] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [x] Enable auto-merge: `gh pr merge <PR-URL> --auto --merge`
- [x] **Monitor PR comments** — poll autonomously; address comments → commit fixes → validate locally → push → wait 180 s → repeat until no unresolved comments remain
- [x] **Monitor CI checks** — poll autonomously; diagnose failures → fix → commit → validate locally → push → wait 180 s → repeat until all checks pass
- [x] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify user — never force-merge

Ownership metadata:

- Implementer: Doug Hubbard
- Reviewer(s): automated (Codacy, CodeRabbit) + maintainer
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on `main`
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Sync approved spec deltas into `openspec/specs/` (global spec)
- [x] Archive the change: move `openspec/changes/owner-icon-listings-and-detail/` to `openspec/changes/archive/YYYY-MM-DD-owner-icon-listings-and-detail/` **in a single atomic commit** that includes both the new location and deletion of the old — do not split into two commits
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-owner-icon-listings-and-detail/` exists and `openspec/changes/owner-icon-listings-and-detail/` is gone
- [x] Commit and push the archive to `main` in one commit
- [x] Prune merged local branch: `git fetch --prune` and `git branch -d feat/owner-icon-listings-and-detail`
