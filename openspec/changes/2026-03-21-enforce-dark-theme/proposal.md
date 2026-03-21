## Why

The site currently has two competing dark-mode strategies that create a visually jarring experience:

1. **Hardcoded-dark components** (`Header`, `PageLayout`, `FormInput`, `MultiSelectDropdown`, `TaxonomyBadge`, `ClassificationBadge`, recipes index filters/pagination) — always render dark colours regardless of any preference.
2. **Dual-mode components** (`RecipeCard`, `RecipeDetail`, `CookbookCard`, `CategoryCard`) — correctly use `dark:` Tailwind variants, but are _currently rendering in light mode_ because no dark trigger is active.

The root cause: Tailwind v4 defaults to `prefers-color-scheme` media-query-based dark mode. The site has no `@custom-variant` override and no `dark` class on `<html>`, so the `dark:` variants only fire when the user's OS is set to dark mode. On light-mode OSes the dual-mode components render white backgrounds against a dark-chrome site — visible inconsistency.

The desired end state (eventually) is a user-selectable theme. The immediate need is to lock the site to dark mode consistently while preserving all light-mode infrastructure for a future toggle.

## Problem Space

- **Current behaviour:** Dark mode activates via OS `prefers-color-scheme`. Components without `dark:` variants are always dark; components with `dark:` variants follow the OS — producing an inconsistent look for users on light-mode OSes.
- **Desired behaviour:** Site always renders in dark mode regardless of OS preference. All `dark:` variants activate unconditionally. No light-mode flash.
- **Constraints:** Must not remove the `dark:` variant infrastructure already present in `RecipeCard`, `RecipeDetail`, etc. — future theme toggle will re-use it.
- **Assumptions:** Users will not notice or object to the lock; this is a temporary UX decision while the site is in active development.
- **Edge cases considered:**
  - Print styles (`src/styles/print.css`) — already scoped separately; not affected.
  - SSR / hydration — adding a static `class="dark"` to `<html>` in the server-rendered root avoids any flash-of-incorrect-theme (FOIT) that a client-side JS toggle would introduce.

## Scope

### In Scope

- Add `@custom-variant dark (&:where(.dark, .dark *));` to `src/styles.css` to switch Tailwind v4 from media-query mode to class-based dark mode.
- Add `className="dark"` to the `<html>` element in `src/routes/__root.tsx` to unconditionally activate the dark class.
- Add `data-testid="recipe-card"` to the root element of `src/components/recipes/RecipeCard.tsx` to enable stable E2E selection.
- Add `src/e2e/dark-theme.spec.ts` with three E2E scenarios verifying dark class presence, SSR rendering, and card dark background.

### Out of Scope

- Converting hardcoded-dark components (`Header`, `PageLayout`, `FormInput`, etc.) to use proper `dark:` variants — that cleanup is a prerequisite for _light_ mode being usable, not for this change.
- Any theme toggle UI or user preference persistence.
- Any new components or styling changes beyond the two files listed above.

## What Changes

- `src/styles.css` — one line added: `@custom-variant dark (&:where(.dark, .dark *));`
- `src/routes/__root.tsx` — `<html lang="en">` → `<html lang="en" className="dark">`
- `src/components/recipes/RecipeCard.tsx` — add `data-testid="recipe-card"` to root element (testability only, no visual change)
- `src/e2e/dark-theme.spec.ts` — new E2E spec with three dark-mode verification scenarios

## Risks

- Risk: `@custom-variant` overrides the default media-query behaviour — users who relied on OS dark mode detection will no longer get automatic light mode.
  - Impact: Cosmetic; site will look the same on dark-OS and slightly different (consistently dark) on light-OS. Acceptable during development.
  - Mitigation: Documented as intentional; the `@custom-variant` line can be removed and the class removed from `<html>` to instantly restore media-query behaviour.

- Risk: SSR rendering adds `class="dark"` to the server HTML — could cause a mismatch if a future hydration step tries to remove it.
  - Impact: Low; no client-side theme toggle exists yet.
  - Mitigation: When the toggle is built, move the class management to a `useEffect` or a server-side cookie read. The static class serves as a safe default in the interim.

## Open Questions

~~Should the `class` attribute on `<html>` be managed via TanStack Router's `HeadContent` / meta system rather than inline JSX on the element?~~

**Resolved — Approach A (direct `className` on `<html>`).**

Three approaches were evaluated:

| Approach | Description | Status |
|----------|-------------|--------|
| **A** — `className="dark"` on `<html>` in `RootDocument` | Static attribute in shell JSX | **Chosen** |
| **B1** — Blocking `<script>` injected via `head()` | Runs before hydration; reads localStorage for user preference | Future, when toggle is built |
| **B2** — `htmlAttributes` via `head()` return value | Cleanest architecture; all document-level config in one place | Blocked — TanStack Router's `head()` API does not support `<html>` attributes today (`HeadContent` only injects into `<head>`) |

Approach A is chosen because:
- Works today with no new patterns.
- SSR-safe — the `dark` class is present in the initial server-rendered HTML, avoiding any flash-of-incorrect-theme.
- Simple to make dynamic when the toggle is built: replace the string literal with a value derived from a cookie or loader, staying in `RootDocument`.

Approach B2 (routing the theme through `head()`) is the more architecturally correct long-term home — it centralises all document-level configuration — but is blocked on a TanStack Start API gap. When that support lands, migrating from A → B2 is a small refactor with no user-visible impact.

When the theme toggle is built, the recommended path is B1 (blocking inline script reading localStorage) as an interim, with B2 as the eventual target if TanStack adds `htmlAttributes` support to `head()`.

## Non-Goals

- Light mode theme cleanup (converting hardcoded-dark components to use `dark:` variants)
- User theme preference UI
- System preference detection / `prefers-color-scheme` passthrough
- Any changes to component styling beyond the two config-level files

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`, and `tasks.md` before implementation starts.
