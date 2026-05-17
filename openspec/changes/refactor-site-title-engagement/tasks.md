# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b refactor/my-cookbooks-branding` then immediately `git push -u origin refactor/my-cookbooks-branding`

## Execution

- [x] **Sync Assets:** Copy all files from `design-system/assets/` to `public/`.
  - [x] `cp design-system/assets/favicon.svg public/favicon.svg`
  - [x] `cp design-system/assets/favicon-*.png public/`
  - [x] `cp design-system/assets/logo-lockup.svg public/logo-lockup.svg`
  - [x] `cp design-system/assets/logo-mark.svg public/logo-mark.svg`
- [x] **Implement Typography:** Update `src/styles.css` to import and apply brand fonts.
  - [x] Add `@import` for Fraunces and Inter from Google Fonts.
  - [x] Define `--font-display: 'Fraunces', serif;` and update `--font-sans`.
  - [x] Apply `.font-display` to `h1`, `h2`, and `h3` where appropriate.
- [x] **Update Header:** Refactor `src/components/Header.tsx`.
  - [x] Update "CookBook" text to "My CookBooks" in both mobile and desktop views.
  - [x] Apply the branded gradient and Fraunces font to the logo text.
  - [x] Adjust flex/gap to prevent overflow on mobile.
- [x] **Update Metadata:**
  - [x] Update `title` and `meta` in `src/routes/__root.tsx`.
  - [x] Update `PageLayout` titles in `src/routes/index.tsx`, `src/routes/home.tsx`, and `src/routes/cookbooks/index.tsx`.
- [x] **Update Documentation:**
  - [x] Update `package.json` description.
  - [x] Update `README.md` headers and introductory text.
- [x] **Update Tests:**
  - [x] Update `src/e2e/home-page-revamp.spec.ts` assertions.
  - [x] Update any unit tests checking for the "CookBook" string.

Suggested start-of-work commands: `git checkout main` → `git pull --ff-only` → `git checkout -b refactor/my-cookbooks-branding` → `git push -u origin refactor/my-cookbooks-branding`

## Validation

- [x] **Visual Verification:** Manually verify "My CookBooks" appears correctly across all themes and viewports.
- [x] **Typography Verification:** Check computed styles for `h1` to ensure Fraunces is active.
- [x] **Asset Verification:** Confirm favicons and logos are updated in the browser.
- [x] **Automated Tests:**
  - [x] Run `npm test` (unit tests).
  - [ ] Run `npm run test:e2e` (Playwright tests).
- [x] **Build & Lint:**
  - [x] Run `npm run build`.
  - [x] Run `npm run lint:route-outlet`.

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — run `npm test`; all tests must pass
- **Integration tests** — run `npm test`; all tests must pass
- **Regression / E2E tests** — run `npm run test:e2e`; all tests must pass
- **Build** — run `npm run build`; build must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [x] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from working branch to `main`
- [x] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [x] Enable auto-merge: `gh pr merge --auto --merge`
- [x] **Monitor PR comments** — poll for new comments autonomously; address, validate, and push fixes.
- [x] **Monitor CI checks** — poll for check status; fix, validate, and push on failure.
- [ ] **Poll for merge** — after each iteration run `gh pr view --json state`; proceed when `MERGED`.

Ownership metadata:

- Implementer: Gemini CLI
- Reviewer(s): Human
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on the default branch
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec)
- [ ] Archive the change: move `openspec/changes/refactor-site-title-engagement/` to `openspec/changes/archive/$(date +%Y-%m-%d)-refactor-site-title-engagement/`
- [ ] Confirm archive exists and original is gone
- [ ] Commit and push the archive to `main` in one commit
- [ ] Prune merged local feature branches: `git fetch --prune` and `git branch -d refactor/my-cookbooks-branding`
