## Why

`src/routes/__root.tsx` has no footer today. The only link to `/terms` or `/privacy-policy`
anywhere in the app's own chrome is a single disclaimer line inside `RegisterForm.tsx` — nothing
links to these pages from logged-in views, the login screen, or account settings. Both pages
(terms-of-service-page, privacy-policy-page) are already published and archived; a "stable,
linkable URL" for legal documents is only meaningfully discoverable if the app actually links to
it outside one form. GitHub issue #626.

## What Changes

- Add a new `Footer` component rendered site-wide from `src/routes/__root.tsx`, directly after
  `{children}` (inside `AuthProvider`, alongside `Header`)
- Footer content is legal-only for this change: a computed copyright line
  (`© {currentYear} My CookBooks`), a link to `/terms`, and a link to `/privacy-policy`, separated
  by the `·` delimiter already used elsewhere in the app for inline meta
- Footer uses `print:hidden` (same Tailwind utility `Header` already uses) so it never appears in
  printed recipes/cookbooks
- Footer renders in normal document flow (not sticky/fixed), with a `border-t
  border-[var(--theme-border)]` separating it from page content
- Follows `design-system/CLAUDE.md`: theme CSS custom properties only, no hard-coded hex, no
  emoji, Inter body type

## Capabilities

### New Capabilities
- `site-footer`: A site-wide footer component rendered on every route, providing a copyright
  line and links to the Terms of Service and Privacy Policy pages. Print-hidden, document-flow,
  theme-token-styled.

### Modified Capabilities
(none — `terms-of-service-page` and `privacy-policy-page` are unchanged; the footer only links to
their existing routes)

## Impact

- `src/routes/__root.tsx`: renders the new `Footer` component after `{children}`
- New file: `src/components/Footer.tsx` (mirrors `src/components/Header.tsx` conventions)
- No route, API, schema, or dependency changes
- No changes to `/terms` or `/privacy-policy` page content
