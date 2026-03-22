## Why

The app was built dark-first and all components use hardcoded dark-palette Tailwind classes (`bg-slate-800`, `text-white`, `text-gray-400`, etc.) with no `dark:` variants. The class-based dark mode toggle (`@custom-variant dark` + `.dark` on `<html>`) is already in place from the `enforce-dark-theme` change, but removing the `.dark` class currently produces white-on-white or near-invisible text across the entire site. This change makes every component dual-mode so a user-facing theme toggle can be shipped in a follow-up.

## What Changes

- **All hardcoded dark-palette classes** across layout, route pages, UI components, and auth components are converted to dual-mode pairs (`bg-white dark:bg-slate-800`, `text-gray-900 dark:text-white`, etc.)
- **Header** — `bg-slate-100 dark:bg-gray-800`; nav links and search input gain light counterparts
- **Mobile sidebar** — `bg-white dark:bg-gray-900` with appropriate border and text adjustments
- **PageLayout** — gradient becomes `from-gray-50 via-white to-gray-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900`
- **Badge components** (TaxonomyBadge, ClassificationBadge) — light mode uses saturated tones: `*-100` backgrounds, `*-700` text, `*-300` borders
- **Form components** (FormInput, MultiSelectDropdown) — inputs use `bg-white dark:bg-slate-700` with appropriate border and placeholder adjustments
- **Auth components** (AuthPageLayout, LoginForm, RegisterForm, ProfileInfo, ForgotPasswordForm, ResetPasswordForm) — all hardcoded dark classes converted
- **Route pages** (home, recipe listing) — hero text, feature cards, filters, search, and pagination all get light-mode counterparts

## Capabilities

### Modified Capabilities

- `site-layout`: Header and PageLayout render correctly in both light and dark mode
- `taxonomy-badges`: TaxonomyBadge uses saturated light-mode tones (amber/violet/emerald -100 bg, -700 text, -300 border)
- `classification-badge`: ClassificationBadge uses cyan-100/cyan-700/cyan-300 in light mode
- `recipe-filters`: Search input, dropdowns, and pagination on the recipe listing page are legible in light mode
- `auth-pages`: Login, register, profile, forgot-password, and reset-password pages are fully usable in light mode
- `home-page`: Hero section and feature cards render correctly on a light background
- `form-inputs`: FormInput and MultiSelectDropdown are styled for both modes

### New Capabilities

None — this is a styling cleanup with no new behaviour.

## Impact

**Files modified:**
- `src/components/Header.tsx`
- `src/components/layout/PageLayout.tsx`
- `src/components/ui/TaxonomyBadge.tsx`
- `src/components/ui/ClassificationBadge.tsx`
- `src/components/ui/FormInput.tsx`
- `src/components/ui/MultiSelectDropdown.tsx`
- `src/components/auth/AuthPageLayout.tsx`
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/RegisterForm.tsx`
- `src/components/auth/ProfileInfo.tsx`
- `src/components/auth/ForgotPasswordForm.tsx`
- `src/components/auth/ResetPasswordForm.tsx`
- `src/routes/index.tsx`
- `src/routes/recipes/index.tsx`

**No files created. No API, routing, or database changes required.**

## Non-Goals

- Adding a user-facing theme toggle button (that is the follow-up change this enables)
- Changing the design of already-dual-mode components (RecipeCard, RecipeDetail, CookbookCard, CategoryCard, RecipeList)
- Any changes to dark mode appearance — dark mode must look identical after this change

## Risks

- **Regression in dark mode**: Every class change is additive (`light-class dark:dark-class`), so dark mode output should be unaffected — but visual regression testing against the current dark appearance is important.
- **Auth component coverage**: Auth components have existing tests but none assert on specific class names. Light-mode correctness should be verified with a quick manual pass or Playwright screenshot.

## Open Questions

None — all design decisions resolved in discovery:
- Badge style: Option A (saturated tones — `*-100` bg / `*-700` text / `*-300` border)
- Header light background: `bg-slate-100`
- PageLayout light gradient: `from-gray-50 via-white to-gray-50`

---

*Scope change note: If scope changes after approval, proposal.md, design.md, specs, and tasks.md must be updated before implementation proceeds.*
