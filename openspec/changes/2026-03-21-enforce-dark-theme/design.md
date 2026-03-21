## Context

Tailwind CSS v4 (the version used in this project) defaults to `prefers-color-scheme` media-query-based dark mode when no explicit configuration is provided. The project's `src/styles.css` contains only `@import "tailwindcss";` with no `@custom-variant` directive. This means all `dark:` utility classes compile to `@media (prefers-color-scheme: dark) { ... }` selectors rather than `.dark .dark\:*` selectors.

The result is that `dark:` variants in `RecipeCard`, `RecipeDetail`, `CookbookCard`, and `CategoryCard` fire based on the user's OS preference, while the rest of the site uses hardcoded dark-palette values that are always dark. On a light-mode OS the dual-mode components render white — visually inconsistent with the chrome.

**Proposal mapping:**
- Proposal: "Switch Tailwind v4 from media-query to class-based dark mode" → Decision: `@custom-variant` in CSS
- Proposal: "Unconditionally activate dark mode" → Decision: static `className="dark"` on `<html>` in SSR root
- Proposal: "Preserve light-mode infrastructure" → Decision: no `dark:` variants removed; approach is additive

## Goals / Non-Goals

**Goals:**
- All `dark:` Tailwind variants activate unconditionally on every page.
- No flash-of-incorrect-theme (FOIT) — dark class is present in the initial server-rendered HTML.
- Zero changes to any component's className strings.
- Light-mode capability is preserved for a future toggle (only the trigger changes, not the styles).

**Non-Goals:**
- User preference persistence or toggle UI.
- Converting hardcoded-dark components to dual-mode.
- Any change to print styles.

## Decisions

### 1. `@custom-variant` in CSS (not a JS config)

**Decision:** Add the following line to `src/styles.css`, immediately after the `@import "tailwindcss";` line:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

**What it does:** Overrides Tailwind v4's default `prefers-color-scheme` behaviour. All `dark:` utilities now compile to class-selector rules — `.dark .dark\:bg-slate-800`, etc. — rather than media-query rules. This is Tailwind v4's documented opt-in for class-based dark mode.

**Rationale:** This is the single source of truth for how dark mode works. Changing it here (CSS) rather than attempting a vite plugin config keeps it co-located with the rest of the Tailwind setup and is the pattern documented in Tailwind v4's migration guide.

**Alternative considered:** Passing `{ darkMode: 'class' }` as a plugin option to `@tailwindcss/vite` — this option does not exist in v4; the plugin takes no configuration. Rejected.

**Testability:** CSS compilation cannot be verified in unit tests (jsdom does not process Tailwind's output). Validated indirectly via E2E: if `dark:` variants produce visible dark styles when the `.dark` class is present, the `@custom-variant` directive compiled correctly.

### 2. Static `className="dark"` on `<html>` in `__root.tsx`

**Decision:** Change `<html lang="en">` to `<html lang="en" className="dark">` in `src/routes/__root.tsx`.

**What it does:** The `.dark` class is present on the root element in the initial server-rendered HTML, so `dark:` variants are active from the first paint. No client-side JS is needed to apply the class.

**Rationale:** TanStack Start renders `__root.tsx` on the server. A static attribute on `<html>` is the simplest, FOIT-free approach. It requires no `useEffect`, no `document.documentElement` manipulation, and no hydration mismatch risk.

**Future toggle path:** When the user preference feature is built, this static class becomes a dynamic value derived from a cookie or localStorage read. The `@custom-variant` line in CSS stays unchanged; only the class management moves from static to dynamic.

**Alternative considered:** Managing the class via a `<script>` injected in `<head>` to run before React hydrates (the "blocking script" pattern used by next-themes). This avoids FOIT even with user preferences but is significantly more complex. Deferred until the toggle is actually built.

**Testability:** Verified via E2E — `document.documentElement.classList.contains('dark')` must return `true` after page load. Also verified by checking that a known dual-mode component (`RecipeCard`) renders with its dark-variant background rather than its light-mode background.

## Testing

Unit tests (jsdom) cannot validate CSS class-based dark mode because Tailwind's compiled stylesheet is not loaded in the test environment. All theme-activation tests are therefore E2E (Playwright).

Two assertions cover the full requirement:

| Test | What it proves |
|------|---------------|
| `html` element has class `dark` on page load | Decision 2 — static class is present in rendered HTML |
| `RecipeCard` renders with dark background, not white | Decisions 1 + 2 combined — `@custom-variant` compiled correctly and the `.dark` trigger activated the `dark:bg-slate-800` variant |

**New E2E test file:** `src/e2e/dark-theme.spec.ts`

Scenario 1 — root element carries the dark class:
- Navigate to `/`
- Assert `await page.evaluate(() => document.documentElement.classList.contains('dark'))` returns `true`

Scenario 2 — dual-mode components render dark styles:
- Navigate to `/recipes` (seeded data must include at least one recipe)
- Wait for at least one recipe card to be visible
- Assert the first recipe card's computed `background-color` is **not** `rgb(255, 255, 255)` (white)
- Note: Tailwind v4 uses the `oklch` color space, so browsers report colors in `oklch()` format rather than `rgb()`. Assert against "not white" rather than a specific oklch value to remain resilient to future Tailwind color adjustments.

Scenario 3 — no flash-of-incorrect-theme (FOIT):
- Navigate to `/`
- Assert the `dark` class is present on `<html>` before any JavaScript executes by checking it in the `domcontentloaded` event (use Playwright's `page.on('domcontentloaded', ...)` or a `waitForFunction` with `{ timeout: 0 }` before hydration completes)

## Risks / Trade-offs

- **OS dark mode users get identical experience;** OS light mode users now see a consistently dark site rather than the current broken mixed state. Net improvement.
- **`@custom-variant` is a global change** — if any future component relies on `prefers-color-scheme` detection for dark mode (instead of the `.dark` class), it will break silently. Mitigation: document the class-based approach in `CLAUDE.md` so future contributors know.

## Rollback / Mitigation

To revert: remove the `@custom-variant` line from `src/styles.css` and remove `className="dark"` from `<html>` in `__root.tsx`. Tailwind reverts to media-query behaviour automatically. No database, API, or component changes to roll back.

## Open Questions

None blocking implementation.
