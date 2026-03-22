# Tasks: Light Mode Theme Support

## 1. Branch Setup

- [x] 1.1 Checkout `main` and pull latest remote changes
- [x] 1.2 Create feature branch `feat/light-mode-theme-support`

## 2. Convert Header.tsx

- [x] 2.1 Apply light/dark class pairs to outer nav bar (`bg-slate-100 dark:bg-gray-800`, text, hover states)
- [x] 2.2 Apply light/dark class pairs to search input (background, text, placeholder)
- [x] 2.3 Apply light/dark class pairs to auth link text and hover states
- [x] 2.4 Apply light/dark class pairs to mobile sidebar: background, divider border, link hovers

## 3. Convert PageLayout.tsx

- [x] 3.1 Replace hardcoded gradient with dual-mode gradient (`from-gray-50 via-white to-gray-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900`)
- [x] 3.2 Update page title (`text-gray-900 dark:text-white`) and description (`text-gray-500 dark:text-gray-400`) text colors

## 4. Convert badge components

- [x] 4.1 `TaxonomyBadge.tsx`: apply Option A color map for meal / course / preparation (`*-100` bg, `*-700` text, `*-300` border in light mode)
- [x] 4.2 `ClassificationBadge.tsx`: apply Option A color map for classification (cyan-100/700/300 in light mode)

## 5. Convert FormInput.tsx and MultiSelectDropdown.tsx

- [x] 5.1 `FormInput.tsx`: label (`text-gray-700 dark:text-gray-300`), input background, border, text, placeholder
- [x] 5.2 `MultiSelectDropdown.tsx`: trigger button, dropdown panel, option hover, option text (selected/unselected), count text

## 6. Convert auth components

- [x] 6.1 `AuthPageLayout.tsx`: card background (`bg-white dark:bg-slate-800`), border, title text
- [x] 6.2 `LoginForm.tsx`: checkbox, remember-me text, footer link text
- [x] 6.3 `RegisterForm.tsx`: footer link text
- [x] 6.4 `ProfileInfo.tsx`: avatar placeholder, icon, name, member-since, info row text
- [x] 6.5 `ForgotPasswordForm.tsx`: body text, footer text
- [x] 6.6 `ResetPasswordForm.tsx`: footer text

## 7. Convert route pages

- [x] 7.1 `src/routes/index.tsx`: hero heading, subtext, body text, secondary CTA button, section heading, feature cards (background, border, heading, body)
- [x] 7.2 `src/routes/recipes/index.tsx`: search input, filter dropdowns, pagination buttons and text, filter tag pills, empty/loading state text, results count

## 8. Tests and verification

- [x] 8.1 Run `npm run test` — all existing tests must pass
- [x] 8.2 Run `npm run test:e2e` — all existing E2E tests must pass
- [ ] 8.3 Manual verification: toggle `.dark` class on `<html>` in devtools and visually confirm both modes on: home, recipe listing, recipe detail, recipe edit, login, register, profile pages
- [ ] 8.4 Confirm dark mode appearance is unchanged from before this change

## 9. PR

- [ ] 9.1 Push branch and open PR referencing GitHub issue #170; title: `feat: convert hardcoded-dark components to support light/dark theme toggle`
- [ ] 9.2 Enable auto-merge on the PR
- [ ] 9.3 Address any failing CI checks
- [ ] 9.4 Respond to and resolve all review comments
- [ ] 9.5 Confirm PR merges cleanly and all status checks pass

## 10. Post-Merge

- [ ] 10.1 Delete local feature branch after merge is confirmed
- [ ] 10.2 Run `/opsx:archive light-mode-theme-support-2026-03-21` to archive this change, mark all tasks complete, and push updates to `main`
