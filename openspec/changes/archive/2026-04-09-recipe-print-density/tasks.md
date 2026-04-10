# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b recipe-print-density-2026-04-09` then immediately `git push -u origin recipe-print-density-2026-04-09`

## Execution

### Task 1 — Update @page margin in print.css

- [x] Edit `src/styles/print.css`: change `@page { margin: 1.5cm; }` → `@page { margin: 1cm; }`
- Spec: MODIFIED @page margin

### Task 2 — Reduce heading sizes in printHeadingDensity.ts

- [x] Edit `src/components/printHeadingDensity.ts`:
  - `PRINT_HEADING_DENSITY_PAGE`: change `print:text-2xl` → `print:text-xl`
  - `PRINT_HEADING_DENSITY_SECTION`: change `print:text-xl` → `print:text-lg`
- Spec: MODIFIED Recipe title print size, MODIFIED Section heading print size

### Task 3 — Update RecipeDetail ingredient list and section margins

- [x] Edit `src/components/recipes/RecipeDetail.tsx`:
  - Ingredient `<ul>`: add `print:columns-2 print:gap-x-8 print:space-y-1` to className
  - Ingredients `<section>`: add `print:mb-4` to className
  - Instructions `<section>`: add `print:mb-4` to className
  - Notes `<section>` (if present): add `print:mb-4` to className
  - Nutrition `<section>` (if present): add `print:mb-4` to className
- Spec: ADDED Ingredient 2-column layout in print, ADDED Tighter ingredient spacing, MODIFIED Section bottom margin

### Task 4 — Update/add unit tests

- [x] In `src/components/recipes/__tests__/RecipeDetail.test.tsx`:
  - Verify ingredient `<ul>` className includes `print:columns-2`, `print:gap-x-8`, `print:space-y-1`
  - Verify recipe title `<h1>` className includes `print:text-xl` (not `print:text-2xl`)
  - Verify section `<h2>` classNames include `print:text-lg` (not `print:text-xl`)
  - Verify section elements include `print:mb-4`
  - Verify empty ingredient list still renders fallback text without error
- Spec: All ADDED and MODIFIED requirements

## Validation

- [x] Run unit/integration tests: `npm run test`
- [x] Run E2E tests: `npm run test:e2e`
- [x] Run type checks: `npx tsc --noEmit`
- [x] Run build: `npm run build`
- [ ] Manually verify cookbook print via `?displayonly=1` on a cookbook with varied recipe lengths
- [ ] Confirm heading sizes and 2-column ingredients look correct in print preview
- [x] All execution tasks marked complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test`; all tests must pass
- **Integration tests** — `npm run test`; all tests must pass
- **Regression / E2E tests** — `npm run test:e2e`; all tests must pass
- **Build** — `npm run build`; build must succeed with no errors
- If **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [x] Run pre-PR self-review before committing
- [x] Commit all changes to `recipe-print-density-2026-04-09` branch and push to remote
- [x] Open PR from `recipe-print-density-2026-04-09` to `main`; reference issue dougis-org/cookbook-tanstack#290
- [x] Wait 120 seconds for agentic reviewers to post comments
- [x] **Monitor PR comments** — address each comment, commit fixes, run full validation, push; repeat until no unresolved comments remain
- [x] Enable auto-merge once no blocking review comments remain
- [x] **Monitor CI checks** — fix any failures, commit, validate locally, push; repeat until all checks pass
- [x] Wait for the PR to merge — **never force-merge**

Ownership metadata:

- Implementer: Doug Hubbard
- Reviewer(s): agentic reviewers + repo owner
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → `npm run test && npm run test:e2e && npm run build` → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on main
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] No documentation updates required (CSS/styling change only)
- [x] Sync approved spec deltas into `openspec/specs/` (global spec) if applicable
- [ ] Archive the change: move `openspec/changes/recipe-print-density-2026-04-09/` to `openspec/changes/archive/2026-04-09-recipe-print-density/` — stage both copy and deletion in a **single commit**
- [ ] Confirm `openspec/changes/archive/2026-04-09-recipe-print-density/` exists and `openspec/changes/recipe-print-density-2026-04-09/` is gone
- [ ] Commit and push the archive to main in one commit
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -d recipe-print-density-2026-04-09`
