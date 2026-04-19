<!-- markdownlint-disable MD013 -->

# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b fix/themed-boot-loader-css-gate` then immediately `git push -u origin fix/themed-boot-loader-css-gate`
- [x] Confirm current issue context: GitHub issue #351 is open/reopened and PR #353 only solved background color, not unstyled app visibility.
- [x] Review `src/routes/__root.tsx`, `src/styles.css`, `src/contexts/ThemeContext.tsx`, `docs/theming.md`, and `src/e2e/fouc-prevention.spec.ts`.

## Execution

- [x] **RED — Expand FOUC E2E coverage first**
  - [x] Add/modify `src/e2e/fouc-prevention.spec.ts` tests that delay the main app stylesheet and assert the "Pre-heating" loader is visible.
  - [x] Assert app shell content is present in the DOM but not visible while app CSS is delayed.
  - [x] Assert delayed CSS completion hides the loader and reveals the app shell.
  - [x] Assert app CSS failure keeps the loader visible and eventually shows retry/status feedback.
  - [x] Assert `dark`, `light-cool`, `light-warm`, legacy `light`, invalid theme, and localStorage failure use expected boot loader theme behavior.
  - [x] Assert app CSS preload remains and print CSS preload is absent.
  - [x] Run the focused FOUC tests and confirm the new tests fail before implementation.
- [x] **GREEN — Implement root boot gate**
  - [x] In `src/routes/__root.tsx`, keep the theme init script before first paint.
  - [x] Add inline critical boot CSS for `html`, `body`, boot loader layout, spinner, app shell cloaking, theme-specific colors, delayed status, and retry affordance.
  - [x] Render a boot loader before app content with the visible text "Pre-heating" and a CSS-only spinner.
  - [x] Wrap the application content (`Header`, route children, devtools, scripts as appropriate) in a stable app shell element such as `#app-shell`.
  - [x] Ensure the boot loader does not rely on Tailwind classes, Lucide icons, images, React state, or external CSS.
- [x] **GREEN — Reveal app via app stylesheet**
  - [x] In `src/styles.css`, add rules that hide the boot loader and reveal the app shell once the stylesheet loads.
  - [x] Keep these rules simple and near the top of `src/styles.css` so app visibility unlocks as soon as app CSS applies.
- [x] **GREEN — Correct stylesheet links**
  - [x] Remove `{ rel: 'preload', as: 'style', href: printCss }` from `src/routes/__root.tsx`.
  - [x] Keep `{ rel: 'preload', as: 'style', href: appCss }` before the app stylesheet link.
  - [x] Validate whether the print stylesheet link can safely use `media="print"` with current print/PDF flows.
  - [x] If compatible, add `media: 'print'` to the print stylesheet link; if not compatible, leave the print stylesheet link as a normal stylesheet and document the reason in comments or task notes.
- [x] **REFACTOR — Keep boot assets maintainable**
  - [x] Keep inline boot CSS and script minimal, static, and readable.
  - [x] Confirm no request-derived or user-supplied values are interpolated into inline CSS/JS.
  - [x] Confirm theme values match `src/styles/themes/dark.css`, `src/styles/themes/light-cool.css`, and `src/styles/themes/light-warm.css`.
  - [x] Update `docs/theming.md` with boot loader theme sync requirements.
  - [x] Run `fix_markdown` and `lint_markdown` on any edited Markdown files.
- [x] Review for duplication and unnecessary complexity.
- [x] Confirm acceptance criteria are covered.

Suggested start-of-work commands: `git checkout main` → `git pull --ff-only` → `git checkout -b fix/themed-boot-loader-css-gate` → `git push -u origin fix/themed-boot-loader-css-gate`

## Validation

- [x] Run focused FOUC tests: `npm run test:e2e -- src/e2e/fouc-prevention.spec.ts`
- [x] Run full unit/integration tests: `npm run test`
- [x] Run full E2E tests: `npm run test:e2e`
- [x] Run TypeScript checks: `npx tsc --noEmit`
- [x] Run production build: `npm run build`
- [x] Run Codacy analysis if available and required by `docs/standards/analysis-and-security.md`.
- [x] Run Snyk only if new dependencies are added.
- [x] Manually smoke a throttled hard reload for all themes (`dark`, `light-cool`, `light-warm`) and confirm the transition is themed loader → structured app, never raw skeleton.
- [x] Manually smoke a print route and browser/PDF print behavior after print preload removal and any `media="print"` change.
- [x] All completed tasks marked as complete.
- [x] All steps in [Remote push validation].

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test`; all tests must pass.
- **Integration tests** — covered by `npm run test`; all tests must pass.
- **Regression / E2E tests** — `npm run test:e2e`; all tests must pass.
- **Type checks** — `npx tsc --noEmit`; must pass.
- **Build** — `npm run build`; build must succeed with no errors.
- If **ANY** of the above fail, iterate and address the failure before pushing.

Use the project's documented commands for each of the above (see `AGENTS.md`, `CONTRIBUTING.md`, and `docs/standards/`).

## PR and Merge

- [x] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing.
- [x] Commit all changes to `fix/themed-boot-loader-css-gate` and push to remote.
- [x] Open PR from `fix/themed-boot-loader-css-gate` to `main`.
- [x] Wait 180 seconds for CI to start and agentic reviewers to post their comments.
- [x] Enable auto-merge: `gh pr merge <PR-URL> --auto --merge`.
- [x] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain.
- [x] **Monitor CI checks** — poll for check status autonomously; when any CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until all checks pass.
- [x] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — never wait for a human to report the merge; never force-merge.

The comment and CI resolution loops are iterative: address → validate locally → push → wait 180 seconds → re-check → poll for merge → repeat until the PR merges.

Ownership metadata:

- Implementer: assigned implementation agent
- Reviewer(s): repository reviewers plus automated CodeRabbit/Codacy reviewers
- Required approvals: per repository branch protection rules

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks.
- Security finding → remediate → commit → validate locally → push → re-scan.
- Review comment → address → commit → validate locally → push → confirm resolved.

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on the default branch.
- [x] Mark all remaining tasks as complete (`- [x]`).
- [x] Update repository documentation impacted by the change.
- [x] Sync approved spec deltas into `openspec/specs/fouc-prevention/spec.md` (global spec).
- [x] Archive the change: move `openspec/changes/fix-themed-boot-loader-css-gate/` to `openspec/changes/archive/YYYY-MM-DD-fix-themed-boot-loader-css-gate/` and stage both the new location and the deletion of the old location in a single commit — do not commit the copy and delete separately.
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-fix-themed-boot-loader-css-gate/` exists and `openspec/changes/fix-themed-boot-loader-css-gate/` is gone.
- [x] Commit and push the archive to the default branch in one commit.
- [x] Prune merged local feature branches: `git fetch --prune` and `git branch -d fix/themed-boot-loader-css-gate`.

Required cleanup after archive: `git fetch --prune` and `git branch -d fix/themed-boot-loader-css-gate`.
