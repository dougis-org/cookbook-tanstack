## Why

Tailwind CSS and its Vite plugin have advanced from 4.1.18 to 4.2.2 since the project's last update. Staying current picks up bug fixes (including a crash fix for nested `@variant` inside `@custom-variant`), Vite 8 readiness, and new color palettes/logical-property utilities for future use.

## What Changes

- Update `tailwindcss` from `4.1.18` → `4.2.2`
- Update `@tailwindcss/vite` from `4.1.18` → `4.2.2`
- Update `package-lock.json` to reflect resolved versions

No application code changes are expected. The deprecated `start-*`/`end-*` utilities (superseded by `inset-s-*`/`inset-e-*` in 4.2.0) are not used in this codebase.

## Capabilities

### New Capabilities

None — this is a dependency maintenance update with no new product capabilities.

### Modified Capabilities

None — no spec-level behavior changes. The `@custom-variant dark` declaration in `src/styles.css` is unaffected by this update.

## Impact

- `package.json` — version constraints updated (or locked versions bumped via lock file)
- `package-lock.json` — resolved versions updated for `tailwindcss` and `@tailwindcss/vite`
- No changes to `src/` files expected
- `@tailwindcss/vite` gains Vite 8 compatibility (project currently uses Vite 7)

## Changelog Summary (4.1.18 → 4.2.2)

| Version | Notable Changes |
|---------|----------------|
| 4.2.2 | Vite 8 support; crash fixes for `calc(var(--spacing)...)` canonicalization |
| 4.2.1 | Restored trailing dash support in functional utility names |
| 4.2.0 | 4 new color palettes (mauve, olive, mist, taupe); logical sizing utilities; `font-features-*`; deprecated `start-*`/`end-*` |

## Risks

- **Low** — minor version bump within v4; no breaking changes identified
- The `@custom-variant` fix in 4.2.0 (infinite loop with nested variants) is not triggered by this project's simple dark-mode variant but is a net positive
- Visual regression is possible but unlikely given minimal CSS customization; verified by running `npm run test:e2e`

## Open Questions

No unresolved ambiguity. The changelog has been reviewed, deprecated utilities confirmed unused, and the update is straightforward.

## Non-Goals

- Upgrading to Vite 8 (separate concern)
- Migrating to `inset-s-*`/`inset-e-*` logical utilities (no `start-*`/`end-*` in use; no migration needed)
- Adding new color palette usage from 4.2.0

---

> **Change-control note:** If scope changes after approval (e.g., also migrating deprecated utilities or upgrading Vite), this proposal, design, specs, and tasks must be updated before apply proceeds.

> **Approval required:** This proposal must be reviewed and explicitly approved before design, specs, tasks, or apply proceed.

> **Tracks:** GitHub issue [dougis/cookbook-tanstack#251](https://github.com/dougis/cookbook-tanstack/issues/251)
