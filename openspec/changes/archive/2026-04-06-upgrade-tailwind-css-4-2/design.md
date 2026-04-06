## Context

Both `tailwindcss` and `@tailwindcss/vite` are pinned to `4.1.18` in `package-lock.json`. The `package.json` spec is `^4.0.6`, so `npm install tailwindcss@latest @tailwindcss/vite@latest` will update the lock file to `4.2.2` without touching the version spec. The two packages are tightly coupled and must move together.

The project's Tailwind surface area is minimal: `@import "tailwindcss"` + one `@custom-variant dark` in `src/styles.css`. No `@theme` overrides, no `@layer` customizations, no complex gradient or container query syntax.

## Goals / Non-Goals

**Goals:**
- Resolve `package-lock.json` to `tailwindcss@4.2.2` and `@tailwindcss/vite@4.2.2`
- Confirm no regressions in styling (dark-mode variant, utility rendering)
- Keep the update atomic: both packages advance together

**Non-Goals:**
- Upgrading Vite from v7 to v8 (even though `@tailwindcss/vite@4.2.2` adds Vite 8 support)
- Adopting new 4.2.0 utilities (logical sizing, `font-features-*`, new color palettes)
- Migrating deprecated `start-*`/`end-*` utilities (none in use)

## Decisions

### D1 — Run `npm install` rather than manual lock-file editing

**Decision:** Use `npm install tailwindcss@latest @tailwindcss/vite@latest` to update the lock file.

**Rationale:** Ensures all transitive peer dependencies resolve correctly. Manual editing of `package-lock.json` risks integrity hash mismatches and incorrect peer resolution.

**Alternatives considered:**
- `npm update tailwindcss @tailwindcss/vite` — would also work within the `^` range, but `@latest` is explicit and matches the intent of the issue.

### D2 — No application code changes

**Decision:** Treat this as a zero-code-change update.

**Rationale:** Changelog review confirms no breaking changes, and codebase audit confirms no use of deprecated utilities. The `@custom-variant dark` syntax is stable across this range.

**Testability:** If no `.tsx`/`.css` files change, any test failure indicates a regression from the Tailwind version itself.

### D3 — Validate with existing test suite, not new tests

**Decision:** Run `npm run test` and `npm run test:e2e` as-is; add no new tests for this update.

**Rationale:** The existing unit + E2E suite provides sufficient coverage for style regression at this scope. Adding Tailwind-version-specific tests would be premature.

## Proposal → Design Mapping

| Proposal Element | Design Decision |
|-----------------|----------------|
| Update both packages together | D1: `npm install` both atomically |
| No application code expected | D2: zero-code-change stance |
| Verify styles and tests | D3: existing test suite is sufficient |

## Risks / Trade-offs

- **Visual regression** → Mitigation: Run `npm run test:e2e` which exercises UI flows; manually spot-check dark mode after update
- **Peer dependency conflict** → Mitigation: `npm install` will surface conflicts; resolve before committing
- **CI environment differs** → Mitigation: Lock file is committed so CI resolves the same versions as local

## Rollback / Mitigation

Rollback is `git restore package.json package-lock.json && npm ci`. No database or runtime state is affected. The change is fully reversible.

**Operational blocking policy:** If CI checks remain red after the update and cannot be resolved within the same PR, revert the lock file and open a follow-up issue before merging.

## Open Questions

No open questions. The change is fully scoped and low-risk.
