## GitHub Issues

- #699

## Why

- Problem statement: Printed recipes have a fixed layout. A single `printShowMeta` toggle shows or hides one combined line (Prep · Cook · Serves · Difficulty) above the ingredients, and Category never prints. Recipe authors cannot choose which attributes appear or where, so printed recipes are hard to organize.
- Why now: Print preferences already exist (`printShow*` fields, settings screen, route-boundary resolver). Extending them is cheap, and the only live user is the author, so the model can be iterated freely.
- Business/user impact: Authors can file printed recipes by the attribute they care about (for example Category in the footer) without editing recipes.

## Problem Space

- Current behavior:
  - `RecipeDetail` prints Source inline with the title (always) and a print-only meta line (`data-testid="print-meta-line"`) gated by `printShowMeta`. The meta line also contains "Added by" when the recipe is in a cookbook with collaborators.
  - Category (classification) badges and the stat grid are `print:hidden`.
  - There is no printed footer. Cookbook print passes a `printFooter` node containing only `#{pageNumber}`.
- Desired behavior: For each of Category, Difficulty, Servings, Prep time and Cook time, the user picks `header`, `footer` or `none`. Choices persist on the user account and are edited on the account settings screen. Selected items print once per recipe, in the header line or in a footer row at the end of the recipe, in both single-recipe and cookbook print.
- Constraints:
  - Better-Auth `additionalFields` supports scalars only, so each element is its own string field.
  - Preferences are resolved at the route boundary and passed as a typed value into `RecipeDetail`.
  - `RecipeDetail`'s `printFooter` slot stays the cookbook-only trailing-content mechanism.
  - Fail-safe resolution: a missing or invalid value falls back to the default, never hiding content by accident.
  - Design-system rules apply (theme tokens, no emoji, "My CookBooks").
- Assumptions:
  - Source stays inline with the title and is not configurable.
  - "Added by" is collaboration attribution, not a recipe attribute. It stays in the header line, unchanged.
  - Prep and Cook time are suppressed when NA, as in the issue.
- Edge cases considered:
  - Existing users have none of the new fields (Better-Auth `defaultValue` applies on create only).
  - Existing `printShowMeta: false` users must keep the meta line hidden.
  - All items `none` leaves a cookbook footer showing only `#N`, as today.
  - A header line with no items and no "Added by" renders nothing.
  - Footer with items but no page number (single recipe print) renders items only.
  - Servings in the footer reflects the scaled serving count shown on screen, as the current meta line does.

## Scope

### In Scope

- Five new user preference fields: `printCategory`, `printDifficulty`, `printServings`, `printPrepTime`, `printCookTime`, each `"header" | "footer" | "none"`.
- Replace `printShowMeta` with the new fields. Existing users are migrated lazily when preferences are resolved.
- Defaults: Category `footer`; Difficulty, Servings, Prep time and Cook time `none`. Users with `printShowMeta` not `false` and no new fields resolve to Prep, Cook, Servings and Difficulty at `header`; users with `printShowMeta: false` resolve to `none` for those four.
- `RecipeDetail` renders header and footer items. The footer is a single row at the end of the recipe: selected items on the left, `printFooter` (cookbook `#N`) on the right.
- Settings screen: a three-way control per element with a static layout sketch.
- Cookbook print inherits the behavior through `RecipeDetail`.
- Unit, component, and E2E coverage.

### Out of Scope

- Live preview on the settings screen (separate follow-up ticket).
- Making Source or "Added by" configurable.
- Per-recipe or per-cookbook overrides.
- Repeating fixed headers or footers on every printed page.
- Removing the legacy `printShowMeta` field from the auth schema (later cleanup).

## What Changes

- `src/lib/printPreferences.ts`: new placement type, defaults, validation, and lazy `printShowMeta` migration in `resolvePrintPreferences`.
- `src/lib/auth.ts`: five new `additionalFields` strings. `printShowMeta` stays as a legacy read-only input.
- `src/components/recipes/RecipeDetail.tsx`: header line and footer row driven by placement; the footer composes with `printFooter`.
- `src/components/account/PreferencesSection.tsx`: placement controls and static layout sketch; save payload includes the new fields.
- `src/routes/cookbooks.$cookbookId_.print.tsx`: keeps passing `printFooter`; verified against the new footer row.
- Delivered as three sequential PRs: (1) preference model, resolver, and settings UI; (2) single-recipe header and footer rendering; (3) cookbook print verification and E2E.

## Risks

- Risk: Lazy migration misreads legacy data.
  - Impact: A user who hid the meta line sees it return, or the reverse.
  - Mitigation: Resolver unit tests cover every combination of legacy flag and new fields.
- Risk: Footer placement collides with `@page cookbook-page` margins or breaks across pages.
  - Impact: Orphaned or clipped footer text in cookbook print.
  - Mitigation: Footer row uses `break-inside: avoid` and renders inside the existing recipe container; verified in cookbook print E2E.
- Risk: Six string fields on the user doc plus the legacy field enlarge the session payload.
  - Impact: Marginal cookie and session growth.
  - Mitigation: Short enum values; acceptable.
- Risk: Print CSS regressions for the existing meta line test IDs.
  - Impact: Existing tests and E2E break.
  - Mitigation: Keep `print-meta-line` for the header line and update tests deliberately.

## Open Questions

- Question: None unresolved. Storage (five string fields), the `printShowMeta` migration, defaults, footer placement (once, at the end of each recipe), cookbook inheritance, and the static settings sketch were settled in exploration.
  - Needed from: N/A
  - Blocker for apply: no

## Non-Goals

- A live print preview.
- Reordering items within the header or footer.
- Changing how Source, "Added by", ingredients, instructions, or notes print.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
