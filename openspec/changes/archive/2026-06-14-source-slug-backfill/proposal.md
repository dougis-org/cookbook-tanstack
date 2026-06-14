## GitHub Issues

- #501

## Why

- Problem statement: The `Source` model has no stable, code-friendly identifier. All downstream references use ObjectId or fragile display names, making the upcoming "Personal" source seed and future source-gating logic brittle.
- Why now: Issue #501 is the foundational blocker for the Personal Source initiative. Issue B (seed Personal source) and Issue F (SourceSelector conditional input) cannot proceed until a stable `slug` field exists.
- Business/user impact: Without a slug, code that must distinguish the seeded "Personal" source from user-attributed sources has no reliable anchor. The risk of referencing the wrong source by ObjectId (which differs across environments) is real.

## Problem Space

- Current behavior: `ISource` has only `name` and `url`. No programmatic identifier exists.
- Desired behavior: Every Source document has a `slug` field — unique, indexed, kebab-cased — that acts as a stable code-level identifier independent of ObjectId and display name.
- Constraints:
  - 150 existing prod Source documents must be backfilled without downtime or data loss.
  - The `slugify()` function in `scripts/migration/lib/transformHelpers.ts` is already defined and must be reused (no new implementation).
  - Backfill must be idempotent (safe to re-run).
  - No existing recipe `sourceId` references are broken (field is additive only).
- Assumptions:
  - Collision analysis across all 150 prod sources confirmed zero slug collisions using the existing `slugify()` function.
  - The "personal" slug is clean — no existing source produces it.
  - `.com` domain names intentionally produce run-together slugs (e.g., `allrecipiescom`) — this is desired, as it signals the source is a website.
  - The local Docker dev database has an empty `sources` collection; the backfill only targets the prod Atlas instance.
- Edge cases considered:
  - Special characters (`&`, `/`, `'`, `.`, `(`, `)`, `,`, `:`) all handled by `slugify()` — verified against full prod dataset.
  - Short slugs like `sw` (from "S&W") and `ch-sugar` (from "C&H Sugar") are unique and acceptable.
  - Parenthetical disambiguators (`Dad (Massenburg)` → `dad-massenburg`, `Mom (Massenburg)` → `mom-massenburg`) produce distinct slugs.

## Scope

### In Scope

- Add `slug: { type: String, required: true, unique: true, index: true }` to `sourceSchema` and `ISource`.
- Backfill script: derives slug from `name` using existing `slugify()`, skips docs already having a slug (idempotent).
- Wire backfill into `src/db/seeds/` alongside meals/courses/preparations pattern.
- Update Source model unit tests to assert the uniqueness constraint and slug presence.

### Out of Scope

- Seeding the "Personal" source document (Issue B — depends on this change).
- SourceSelector UI changes (Issue F — depends on Issue B).
- Adding slug to the recipe import / API create/update flows (separate concern).
- Exposing `slug` in any public API response.
- Migrating the local Docker dev database (empty; no action needed).

## What Changes

- `src/db/models/source.ts` — add `slug` to `ISource` interface and `sourceSchema`.
- `src/db/seeds/sources.ts` — new seed/backfill file: derives slug for every existing document, upserts safely.
- `src/db/seeds/index.ts` — call `seedSources()` (or `backfillSourceSlugs()`) alongside existing seed calls.
- Model test file for Source — add uniqueness constraint test and slug field assertion.

## Risks

- Risk: Unique index creation on a non-empty prod collection fails if any two names produce the same slug.
  - Impact: Migration blocked; prod write operations unaffected (index not yet applied).
  - Mitigation: Collision analysis confirmed zero collisions across all 150 prod documents. Risk is effectively zero.

- Risk: Backfill script runs against local dev DB (empty) and appears to succeed, masking a prod issue.
  - Impact: False confidence in backfill; prod still unindexed.
  - Mitigation: Script logs document count processed. Zero-document runs emit a clear warning. Prod run must be verified separately.

- Risk: `required: true` breaks reads of existing un-slugged documents before backfill runs.
  - Impact: Any code that reads Sources between schema deploy and backfill run would fail Mongoose validation on the `slug` field.
  - Mitigation: Deploy order — run backfill before enabling `required: true`, or temporarily deploy with `required: false`, backfill, then tighten to `required: true`.

## Open Questions

- No unresolved ambiguity. Collision analysis is complete, slugify strategy is confirmed, and the "personal" slug is clean.

## Non-Goals

- Slug generation for user-created sources (future: if users can add sources, the API layer will handle slug derivation and collision resolution at write time).
- Renaming or merging existing Source documents.
- Changing the `slugify()` function implementation.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
