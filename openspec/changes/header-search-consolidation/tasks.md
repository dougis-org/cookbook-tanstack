# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feature/header-search-consolidation` then immediately `git push -u origin feature/header-search-consolidation`

## Execution

### Task 3 — Read current implementations

- [x] Read `src/components/Header.tsx` in full
- [x] Read `src/routes/recipes/index.tsx` search-related sections
- [x] Read `src/e2e/recipes-list.spec.ts` to understand existing E2E test structure

### Task 4 — Refactor `Header.tsx`: search state and URL sync

- [x] Add `inputValue` / `setInputValue` state (replaces `headerSearch`)
- [x] Add `mobileSearchOpen` / `setMobileSearchOpen` state
- [x] Add `useRouterState` import and a `useEffect` that reads `?search=` from the current location and syncs it into `inputValue`
- [x] Replace `handleHeaderSearch` (form submit) with a `debouncedNavigate` callback using `useRef<ReturnType<typeof setTimeout>>` (300ms debounce), navigating to `{ to: '/recipes', search: (prev) => ({ ...prev, search: value || undefined }) }`
- [x] Remove the `<form onSubmit>` wrapper; keep only the `<input>` with `onChange`

### Task 5 — Refactor `Header.tsx`: desktop search (always visible)

- [x] Remove `hidden md:flex` from the search container — replace with `flex`
- [x] Add the cyan dot indicator inside the search icon container: render `<span className="absolute ... w-2 h-2 rounded-full bg-cyan-400" />` when `inputValue` is non-empty
- [x] Add `relative` positioning to the search icon wrapper to contain the dot

### Task 6 — Refactor `Header.tsx`: mobile overlay (Style B)

- [x] On mobile (`md:hidden`): render a search icon button with `aria-label="Search recipes"` and the cyan dot when `inputValue` is non-empty
- [x] When `mobileSearchOpen` is true: render a full-width overlay div that replaces the header row content, containing:
  - Full-width `<input>` (auto-focused via `autoFocus` prop) with `value={inputValue}` and the same `onChange` debounce handler
  - An `✕` close button (`aria-label="Close search"`) that sets `mobileSearchOpen(false)` (does NOT clear `inputValue` — preserves active search)
  - Escape key listener that closes the overlay
- [x] The overlay uses `position: relative` within the header and hides logo/auth buttons conditionally (conditional render based on `mobileSearchOpen`)

### Task 7 — Remove search input from `src/routes/recipes/index.tsx`

- [x] Delete the search input JSX block (the `<div className="relative">` containing the `<Search>` icon and `<input>`)
- [x] Remove: `searchInputRef` (`useRef`), `searchValue` (`useState`), the `useEffect` that syncs `searchValue` from `search`, `debouncedSearch` (`useCallback`), `debounceRef` (`useRef`), the `'/'` keyboard shortcut `useEffect`
- [x] Remove unused imports: `useRef`, `useCallback` (if no longer used), `Search` icon (if no longer used)
- [x] Verify the `search` variable (from `Route.useSearch()`) is still passed to the tRPC query unchanged

### Task 8 — Update E2E tests in `src/e2e/recipes-list.spec.ts`

- [x] Replace `page.getByTestId("recipe-search-input")` (2 occurrences) with a selector targeting the header search input (e.g., `page.getByRole('searchbox', { name: /search recipes/i })` or a new `data-testid="header-search-input"` added to the header input)
- [x] Add `data-testid="header-search-input"` to the header `<input>` in `Header.tsx` (desktop and mobile overlay inputs)
- [x] Verify the E2E tests still correctly test search filtering behaviour

### Task 9 — Review for dead code and cleanup

- [x] Confirm no unused imports remain in `Header.tsx` or `recipes/index.tsx`
- [x] Confirm TypeScript compiles with no errors: `npx tsc --noEmit`

## Validation

- [x] Run unit/integration tests: `npm run test`
- [x] Run E2E tests: `npm run test:e2e`
- [x] Run type check: `npx tsc --noEmit`
- [x] Run build: `npm run build`
- [ ] Manually verify on desktop: header search auto-filters, cyan dot appears/disappears, input populates from URL
- [ ] Manually verify on mobile viewport (375px): icon shows, overlay opens on tap, auto-focuses, Escape closes, ✕ closes
- [x] All completed tasks marked as complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test` — all tests must pass
- **E2E tests** — `npm run test:e2e` — all tests must pass
- **Build** — `npm run build` — must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [ ] Run pre-PR self-review before committing
- [ ] Commit all changes to `feature/header-search-consolidation` and push to remote
- [ ] Open PR from `feature/header-search-consolidation` to `main`; enable auto-merge
- [ ] Wait 120 seconds for agentic reviewers to post comments
- [ ] **Monitor PR comments** — address each, commit fixes, run all validation steps, push; repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — diagnose and fix any failures, commit, validate locally, push; repeat until all checks pass
- [ ] Wait for PR to merge — never force-merge; if a human force-merges, proceed to Post-Merge

Ownership metadata:

- Implementer: Doug
- Reviewer(s): agentic reviewers (CodeRabbit, Codacy)
- Required approvals: 1 human or auto-merge after green CI

Blocking resolution flow:

- CI failure → fix → commit → validate locally (`npm run test && npm run test:e2e && npm run build`) → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec)
- [ ] Archive the change: move `openspec/changes/header-search-consolidation/` to `openspec/changes/archive/YYYY-MM-DD-header-search-consolidation/` **in a single commit** staging both the new location and deletion of the old — never split into two commits
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-header-search-consolidation/` exists and `openspec/changes/header-search-consolidation/` is gone
- [ ] Commit and push archive to `main` in one commit
- [ ] `git fetch --prune` and `git branch -d feature/header-search-consolidation`
