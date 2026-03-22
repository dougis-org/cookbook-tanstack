# Tasks: Light Mode Theme Support

## Task 1 — Pull main and create branch
- Pull latest `main`
- Create branch `feat/light-mode-theme-support`

## Task 2 — Convert Header.tsx
- Apply light/dark class pairs to outer nav bar, search input, and all auth link states
- Apply light/dark class pairs to mobile sidebar: background, divider, link hovers

## Task 3 — Convert PageLayout.tsx
- Replace gradient with dual-mode gradient (`from-gray-50 via-white to-gray-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900`)
- Update page title and description text colors

## Task 4 — Convert badge components
- `TaxonomyBadge.tsx`: apply Option A color map for meal / course / preparation
- `ClassificationBadge.tsx`: apply Option A color map for classification (cyan)

## Task 5 — Convert FormInput.tsx and MultiSelectDropdown.tsx
- `FormInput.tsx`: label, input background, border, text, placeholder
- `MultiSelectDropdown.tsx`: trigger, panel, option hover, option text, count text

## Task 6 — Convert auth components
- `AuthPageLayout.tsx`: card background, border, title
- `LoginForm.tsx`: checkbox, remember-me text, footer text
- `RegisterForm.tsx`: footer text
- `ProfileInfo.tsx`: avatar placeholder, icon, name, member-since, info rows
- `ForgotPasswordForm.tsx`: body text, footer text
- `ResetPasswordForm.tsx`: footer text

## Task 7 — Convert route pages
- `src/routes/index.tsx`: hero text, CTA buttons, section heading, feature cards
- `src/routes/recipes/index.tsx`: search input, filter dropdowns, pagination, filter pills, empty/loading states

## Task 8 — Tests and verification
- Run `npm run test` — all existing tests must pass
- Run `npm run test:e2e` — all existing E2E tests must pass
- Manual verification: toggle `.dark` class on `<html>` in devtools and visually confirm both modes on: home, recipe listing, recipe detail, recipe edit, login, register, profile pages

## Task 9 — PR
- Push branch and open PR referencing GitHub issue #170
- Enable auto-merge
