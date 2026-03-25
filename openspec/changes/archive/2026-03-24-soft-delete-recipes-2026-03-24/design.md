## Context

The `recipes.delete` tRPC mutation currently hard-deletes the recipe document via `findByIdAndDelete` inside a MongoDB transaction that also removes cookbook entries and recipe likes. This is irreversible.

The change introduces a soft-delete flag (`deleted: boolean`) on the Recipe schema and automatically filters it from all application reads via Mongoose pre-find middleware — preserving the cascade cleanup behaviour while protecting the primary recipe document.

**Proposal → Design mapping:**

| Proposal element | Design decision |
|---|---|
| Soft-delete flag | `deleted: boolean`, default `false`, in `recipeSchema` |
| Filter at DB layer | Mongoose pre-find middleware on schema (not MongoDB view) |
| Backward compat with existing docs | Filter expression `{ deleted: { $ne: true } }` |
| Write path for soft-delete | `Recipe.updateOne()` — bypasses pre-hooks |
| Cascade cleanup unchanged | Cookbook + RecipeLike ops stay inside same transaction |
| Transaction retained | `mongoose.startSession()` + `session.withTransaction()` unchanged |

## Goals / Non-Goals

**Goals:**
- Prevent permanent loss of recipe data on delete
- Zero change to application query code (filtering is schema-level)
- No API contract changes (mutation signature unchanged)
- Backward compatibility with existing recipe documents that lack the `deleted` field

**Non-Goals:**
- Restore / undelete functionality
- Admin visibility into soft-deleted recipes
- Hard-purge / cleanup job for deleted recipes
- Backfill migration for existing documents

## Decisions

### Decision 1: Mongoose pre-find middleware over MongoDB view

**Chosen:** Mongoose pre-find hooks on `recipeSchema`

**Alternatives considered:**
- **MongoDB view** (`recipes_active` view over `recipes` collection): Would require a model split (read model → view, write model → raw collection) since views are read-only. Awkward in Mongoose and requires DB-level setup outside the application.
- **Scattered `{ deleted: false }` filters**: Developer discipline required; any missed query silently surfaces deleted recipes.

**Rationale:** Middleware gives the same encapsulation as a view (filter is automatic and central) while keeping a single model and staying within the TypeScript/Mongoose layer. An escape hatch is available if raw collection access is ever needed.

### Decision 2: `{ deleted: { $ne: true } }` over `{ deleted: false }`

**Rationale:** Existing recipe documents do not have the `deleted` field. `{ deleted: false }` would not match documents where the field is absent. `{ deleted: { $ne: true } }` matches absent, `null`, and `false` — so no migration or backfill is required.

### Decision 3: `Recipe.updateOne()` for the soft-delete write

The pre-find middleware hooks `findOneAndUpdate` (which `findByIdAndUpdate` uses). Using `findByIdAndUpdate` for the soft-delete write would inject `{ deleted: { $ne: true } }` into the filter — preventing the update if the document was already soft-deleted (a no-op edge case, but semantically wrong).

`updateOne` is not covered by `pre('findOneAndUpdate')`, so it bypasses the middleware cleanly. This is the correct tool for a targeted update-by-id when you do not need the returned document.

### Decision 4: Hooks to register

| Mongoose method | Hook type | Reason |
|---|---|---|
| `find` | `pre('find')` | List queries |
| `findOne` | `pre('findOne')` | `findById` is an alias; covers getById and ownership checks |
| `findOneAndUpdate` | `pre('findOneAndUpdate')` | Edit mutation; prevents editing soft-deleted recipes |
| `countDocuments` | `pre('countDocuments')` | List pagination total count |

`findOneAndDelete` is not registered — the write path uses `updateOne`, not `findByIdAndDelete`. If `findOneAndDelete` is ever added elsewhere, it should also be hooked.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| New hook type missed in future | Comment in model file explains the middleware contract; document in design |
| `findOneAndUpdate` hook prevents editing soft-deleted docs | Desired behaviour — document in comments |
| Test helpers using `findByIdAndUpdate` for fixture setup | Safe — fixtures are not soft-deleted; middleware filter matches |
| `updateOne` bypass creates a footgun for future devs | Prominent comment on the `updateOne` call explaining why it bypasses middleware |

## Rollback / Mitigation

- The `deleted` field defaults to `false`/absent on all existing documents, so rolling back the middleware change restores previous behaviour without any data cleanup
- If the mutation is rolled back, `deleted: true` documents remain in the collection but are invisible to the application — no user impact
- No DB migration means no migration rollback needed

## Open Questions

None — all decisions resolved during exploration phase.
