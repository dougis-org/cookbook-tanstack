## ADDED Requirements

None.

## MODIFIED Requirements

None.

## REMOVED Requirements

### Requirement: REMOVED Personal Source Name field rendering (SourceSelector)

Reason for removal: The `SourceSelector` component is retired from the recipe edit form and replaced by `RecipeSourcePicker` (capability `recipe-source-picker`), which owns the equivalent "Personal Name" field rendering going forward. See `recipe-source-picker`'s "ADDED Personal Source Name field in the recipe source picker".

### Requirement: REMOVED personalSourceName callbacks (SourceSelector)

Reason for removal: Superseded by `RecipeSourcePicker`'s personal-name callback wiring in capability `recipe-source-picker`. `SourceSelector.tsx` has no remaining consumers after this change and is deleted.

### Requirement: REMOVED sourcesRouter output schema requirement ownership (SourceSelector)

Reason for removal: The requirement that `sources.list`, `sources.search`, and `sources.byId` include `slug` remains true and in effect, but ownership of sourcesRouter-related requirements moves to capability `recipe-source-picker`, which extends the router further (`sources.listPage`, bounded `sources.search`). This capability (`source-selector`) is retired, not the underlying router behavior.

### Requirement: REMOVED Client-side personalSourceName persistence (SourceSelector)

Reason for removal: `SourceSelector` itself is retired; the client-side retention behavior (not clearing `personalSourceName` on source change/clear) is carried forward as an implementation detail of `RecipeSourcePicker`, which is expected to preserve the same UX guarantee, though it is not re-specified as a distinct capability requirement in `recipe-source-picker` beyond the ADDED "Personal Source Name" requirements already covering selection/deselection behavior.

## Traceability

- **Proposal element -> Requirement**:
  - Replace `SourceSelector` with the new sorted/paginated picker in the recipe edit form -> REMOVED Personal Source Name field rendering (SourceSelector); REMOVED personalSourceName callbacks (SourceSelector); REMOVED sourcesRouter output schema requirement ownership (SourceSelector); REMOVED Client-side personalSourceName persistence (SourceSelector)
- **Design decision -> Requirement**:
  - Decision 3 (`RecipeSourcePicker` replaces `SourceSelector`) -> all REMOVED requirements above
- **Requirement -> Task(s)**:
  - All REMOVED requirements -> Task: Remove `SourceSelector.tsx` and its dedicated tests once `RecipeForm.tsx` no longer references it

## Non-Functional Acceptance Criteria

### Requirement: Security

See functional requirement in capability `recipe-source-picker`: "Personal source name is not exposed to unauthorized viewers" — this guarantee must hold after `SourceSelector`'s retirement, carried forward by `RecipeSourcePicker`.
