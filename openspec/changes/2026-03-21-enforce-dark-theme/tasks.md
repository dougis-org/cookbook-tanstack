## 1. Branch Setup

- [x] 1.1 Checkout main and pull latest: `git checkout main && git pull --ff-only`
- [x] 1.2 Create feature branch: `git checkout -b feat/enforce-dark-theme`

## 2. Core Implementation

- [x] 2.1 In `src/styles.css`, add `@custom-variant dark (&:where(.dark, .dark *));` on the line immediately after `@import "tailwindcss";`
- [x] 2.2 In `src/routes/__root.tsx`, change `<html lang="en">` to `<html lang="en" className="dark">`

## 3. Tests

- [x] 3.1 Create `src/e2e/dark-theme.spec.ts` with the following three scenarios (use `gotoAndWaitForHydration` from `src/e2e/helpers/app` for navigation):
  - **root dark class** — navigate to `/`; assert `document.documentElement.classList.contains('dark')` is `true`
  - **dual-mode components render dark** — navigate to `/recipes`; wait for a recipe card to be visible; assert its computed `background-color` is not `rgb(255, 255, 255)` (white) and not `rgba(0, 0, 0, 0)` (transparent — guards against false-negative if selector misses or stylesheet fails to load)
  - **no FOIT** — navigate to `/` with `{ waitUntil: 'commit' }`; inspect the raw HTML response body via `response.text()` and assert it matches `/<html[^>]*class=["'][^"']*\bdark\b/` — this confirms the class is emitted by the server, not added by client-side JS

## 4. Validation

- [x] 4.1 Run unit/integration tests: `npm run test` — all must pass
- [x] 4.2 Run E2E tests: `npm run test:e2e` — all must pass (including the new `dark-theme.spec.ts`)
- [x] 4.3 Run type check + build: `npm run build` — must complete with no TypeScript errors
- [ ] 4.4 Visually verify in dev server (`npm run dev`):
  - Recipe list page: cards render with dark backgrounds (not white)
  - Recipe detail page: content areas render dark (not white)
  - Header and PageLayout: unchanged (still dark)
  - Verify on a light-mode OS or with OS theme temporarily switched to light — site should remain dark

## 5. PR and Merge

- [x] 5.1 Commit with message: `feat: enforce dark mode via class-based Tailwind variant`
- [x] 5.2 Push branch and open PR
- [x] 5.3 Enable auto-merge on the PR (per `docs/standards/ci-cd.md`)
- [ ] 5.4 Resolve any CI failures or review comments before merge

## 6. Post-Merge

- [ ] 6.1 Delete feature branch after merge
- [ ] 6.2 Add a note to `CLAUDE.md` under Conventions → Styling: "Dark mode is class-based (`@custom-variant dark`). The `.dark` class is applied statically to `<html>` in `__root.tsx`. Do not use `prefers-color-scheme` for dark mode detection."
- [ ] 6.3 Run `/opsx:archive` to archive this change

Ownership metadata:
- Implementer: —
- Reviewer(s): —
- Required approvals: 1

Blocking resolution flow:
- CI failure → fix → re-run checks
- Security finding → remediate → re-scan
- Review blocker → address comments or escalate
