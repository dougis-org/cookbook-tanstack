## GitHub Issues

- #502

## Why

- Problem statement: The "Personal" Source (slug: "personal") is a critical dependency for the personal-source feature initiative but is not seeded in the database, leading to potential lookup issues and empty dropdown options.
- Why now: The rest of the Personal Source features (Recipe schema changes, frontend UI conditional fields, tRPC authorization checks, and path alias deployment container fixes) are complete and merged, making this database seed the final chore needed to make the feature functional.
- Business/user impact: Allows users to save and view recipes with a "Personal" source name correctly, improving user experience and avoiding blank/invalid option states.

## Problem Space

- Current behavior: No "Personal" source exists in the database. `npm run db:seed` only seeds meals, courses, preparations, and classifications, and backfills slugs for existing sources.
- Desired behavior: `npm run db:seed` includes seeding a default "Personal" source (name: "Personal", slug: "personal") idempotently (upsert by slug).
- Constraints: Must be idempotent. Subsequent runs of the seed script must not create duplicate sources or fail.
- Assumptions: The `Source` model includes the `slug` field (already verified).
- Edge cases considered:
  - If a source with slug "personal" already exists, its details (name: "Personal") should be ensured without creating a new document or throwing errors.
  - If a source named "Personal" exists but has no slug, `backfillSourceSlugs()` will generate `slug: "personal"` first, which the new seed will then correctly match and update idempotently.

## Scope

### In Scope

- Add or extend a seeding function in `src/db/seeds/sources.ts` to upsert `{ slug: "personal", name: "Personal" }`.
- Wire the new seeding function into the main seed entry point `src/db/seeds/index.ts`.
- Add integration tests verifying that `seedSources()` correctly creates the Personal source on a clean database and runs idempotently on subsequent executions.

### Out of Scope

- Creating or editing the Mongoose `Source` schema itself (it already has the `slug` field).
- UI changes or routing logic (already complete).
- Data migrations to convert existing user sources (handled in other issues like #510).

## What Changes

- `src/db/seeds/sources.ts`: Extend the file to export `seedSources()` which upserts `{ slug: "personal", name: "Personal" }`.
- `src/db/seeds/index.ts`: Import and call `seedSources()` after `backfillSourceSlugs()`.
- `src/db/models/source.test.ts`: Add integration tests covering the new `seedSources()` function.

## Risks

- Risk: Concurrent seeding or multiple seed executions might duplicate records if the lookup is not done by slug.
  - Impact: Duplicate "Personal" sources, causing confusion or schema unique index violations.
  - Mitigation: Query by `slug: "personal"` and use Mongoose/MongoDB `{ upsert: true }` to ensure idempotency.

## Open Questions

- Question: Should any other fields (e.g. an optional `url`) be seeded for the Personal source?
  - Needed from: Product/Tech Lead
  - Blocker for apply: no (defaults to undefined/omitted)

## Non-Goals

- Seeding other default sources (e.g., specific magazines or blogs). This change is strictly scoped to the special "Personal" source.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
