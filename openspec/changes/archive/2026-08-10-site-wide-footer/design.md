## Context

`src/routes/__root.tsx` renders the app shell: `Header` → `VerificationBanner` → `{children}`,
all inside `AuthProvider`/`ThemeProvider`/`QueryClientProvider`. `Header` already establishes the
chrome conventions this footer must follow: theme CSS custom properties (`--theme-*`), the
`print:hidden` Tailwind utility (backed by `.print\:hidden { display: none !important }` in
`src/styles/print.css`), and `design-system/CLAUDE.md` as the styling source of truth. No footer
component exists in the codebase today. Terms (`/terms`) and Privacy Policy (`/privacy-policy`)
routes are both shipped; the footer's only job is to make them discoverable app-wide.

## Goals / Non-Goals

**Goals:**
- Render a legal-only footer (copyright, Terms link, Privacy Policy link) on every route
- Match existing chrome conventions exactly: theme tokens, print-hidden, no new dependencies
- Keep the component small and self-contained — no state, no data fetching

**Non-Goals:**
- No expanded site-nav footer (no links to Recipes/Cookbooks/Categories/About/social) — explicitly
  deferred; issue #626 scoped this to legal links only for this change
- No sticky/fixed positioning — document flow only
- No changes to the Terms or Privacy Policy page content/routes themselves

## Decisions

- **Placement in `__root.tsx`**: render `<Footer />` immediately after `{children}`, still inside
  `AuthProvider`. Mirrors where `Header` sits in the same tree; keeps the footer inside the same
  provider stack as the rest of the shell in case a later change needs auth/theme context there,
  without requiring a prop-drilled re-render boundary.
- **New component `src/components/Footer.tsx`**, not inlined in `__root.tsx`. `Header` is already
  its own file; keeping `Footer` symmetrical avoids a growing `__root.tsx` and matches the
  "one component per chrome element" pattern already in use.
- **Copyright year is computed** (`new Date().getFullYear()`), not a hardcoded literal, so the
  footer never needs a yearly manual edit.
- **`·` (U+00B7) as the separator** between copyright, Terms, and Privacy Policy — this is the
  existing app-wide convention for inline meta separation (e.g. `3 recipes · 2 chapters`),
  documented in `design-system/CLAUDE.md`. No new separator glyph introduced.
- **`print:hidden` on the footer root element** — identical mechanism to `Header`
  (`className="site-header print:hidden ..."`). No changes to `print.css` needed since the
  existing `.print\:hidden` rule is element-agnostic.
- **`border-t border-[var(--theme-border)]`** on the footer root to visually separate it from
  page content, matching the pattern used for the drawer's theme-picker section
  (`border-t border-[var(--theme-border)] p-4` in `Header.tsx`).
- **Document flow, not sticky/fixed** — this is a content-heavy recipe app with long pages;
  a sticky footer would either overlay content or require layout reflow accounting the rest of
  the shell doesn't currently do. Plain flow keeps the change additive and low-risk.

## Risks / Trade-offs

- **[Risk]** A future issue expands footer scope (nav links, About, social) and this component
  needs restructuring. **Mitigation**: keep `Footer.tsx` a plain, unstyled-opinion-free container
  so adding a nav column later is additive, not a rewrite.
- **[Risk]** Forgetting `print:hidden` would leak the footer into printed recipes/cookbooks.
  **Mitigation**: mirror `Header`'s exact className pattern; covered by a scenario in specs.
