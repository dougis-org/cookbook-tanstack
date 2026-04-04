## Context

`src/components/recipes/RecipeList.tsx` is an unused stub component. It has zero callers (confirmed by codebase search), renders only a recipe name in a plain div, and does not use `RecipeCard`. The real recipe listing UI lives inline in `src/routes/recipes/index.tsx`.

## Goals / Non-Goals

**Goals:**
- Remove the dead file to eliminate false affordance and tech debt

**Non-Goals:**
- Introducing a real shared `RecipeList` component
- Refactoring any existing callsite

## Decisions

**Delete, don't refactor.**

The proposal explored upgrading `RecipeList` to wrap `RecipeCard` and potentially serve `categories.$categoryId.tsx` and `sources.$sourceId.tsx`. Both those pages render a 5-line grid inline — below the threshold where a shared component adds more clarity than indirection. Deletion is the right call.

| Option | Rationale |
|--------|-----------|
| Delete | Zero callers, no migration needed, closes tech debt immediately |
| Upgrade + reuse | Only 2 potential callers, each 5 lines; abstraction cost exceeds benefit |

**No migration required.** TypeScript strict mode (`noUnusedLocals`) would surface any missed import at build time, providing a safety net if a caller ever existed and was missed.

## Risks / Trade-offs

None. The file is unreferenced. Deletion is safe.

**Rollback / Mitigation:** Git history preserves the file if it is ever needed. No rollback procedure required.

## Open Questions

None.
