## GitHub Issues

- #380

## Why

- **Problem statement**: CookBook currently supports only file-based JSON import (exporting and re-importing CookBook recipes). External recipe URLs (AllRecipes, Food Network, etc.) cannot be imported — users must manually create recipes or rely on third-party tools.
- **Why now**: URL import is the differentiator for the Executive Chef tier, driving conversion and retention. File export import alone has low value and doesn't justify a premium subscription.
- **Business/user impact**: URL import makes the Executive Chef tier ($9.99/month) compelling — users can build libraries from any recipe site. Expected lift: conversion 3–5% of Home Cook → Executive Chef users.

## Problem Space

- **Current behavior**: `/import/` page accepts only `.json` files (CookBook exports). Non-authenticated and below–Executive Chef users see an inline tier wall. Empty recipes from external sites are possible only via manual entry.
- **Desired behavior**: `/import/` page accepts a recipe URL (AllRecipes, Serious Eats, etc.). System fetches HTML, parses structured recipe data (Schema.org `ld+json`), and normalizes it into CookBook format. AI (Claude Haiku) handles unstructured fallback. User reviews normalized recipe in a preview modal before confirming import (reusing existing `ImportPreviewModal`).
- **Constraints**:
  - Cost must not exceed $0.01 per URL import (use only Haiku, truncate HTML, cap output tokens)
  - Tier gating: Executive Chef only (same as file import)
  - URL import is primary, file import is secondary but must remain functional
  - Cannot introduce new external dependencies beyond `@anthropic-ai/sdk`
- **Assumptions**:
  - Most recipe sites embed Schema.org Recipe markup — ~80% coverage on major sites
  - Haiku (vs. Sonnet/Opus) is sufficient for unstructured recipe extraction
  - Per-user rate limit (10 imports/hour) is adequate to prevent runaway AI costs
- **Edge cases considered**:
  - URL with no structured data and broken HTML — Haiku extraction attempt; if it fails, user sees error and can try file import
  - URL timeouts (>5s fetch) — graceful timeout error shown to user
  - Schema.org Recipe with missing required fields (e.g., no name) — validation fails, error message guides user
  - Recipe data is malformed JSON in `ld+json` — caught during schema parse, fallback to Haiku
  - Session tier missing or undefined — gracefully defaults to `home-cook`, shows tier wall

## Scope

### In Scope

- New `recipes.importFromUrl` tRPC mutation (server-side fetch, parse, normalize)
- Parsing pipeline: Schema.org first, Haiku fallback (cost-controlled)
- `UrlImportInput` component (URL input + submit button)
- Update `/import/` route to display URL import as primary method
- Reuse existing `ImportPreviewModal` for preview flow
- Rate limiting: 10 URL imports per user per hour (in-process)
- All imports created from URLs default to `isPublic: true` (matches file import behavior)
- Unit tests for parsing logic, integration tests for tRPC mutation
- E2E test: URL import flow (fetch → preview → confirm)

### Out of Scope

- Cloudinary/S3 image upload (images in schema are saved as `imageUrl` strings; future Cloudinary work handles re-hosting if needed)
- Auth tier downgrades reconciling imported recipes (out of scope for reconcile-user-content.ts; imported public recipes remain)
- Caching parsed recipes — each URL import is independent
- Custom recipe source tracking — source can be tracked in notes or future `sourceId` field if needed
- Mobile file picker optimization (out of scope for this change)
- CDN caching or service-worker strategies
- Internationalization (schema extraction works across languages; AI responses in English only for now)

## What Changes

1. **New file**: `src/lib/ai-extractor.ts` — `AIExtractor` interface + `AnthropicExtractor` implementation (prompt caching on system prompt)
2. **New file**: `src/lib/rate-limiter.ts` — Per-user rolling-window rate limiter (testable, reusable)
3. **New file**: `src/lib/recipe-url-import.ts` — URL fetch, Schema.org parse, AI extractor fallback
4. **New file**: `src/components/recipes/UrlImportInput.tsx` — URL input field + button
5. **New files**: Tests for URL import (unit, integration, E2E)
6. **Modified**: `src/server/trpc/routers/recipes.ts` — Add `importFromUrl` mutation + rate limit + tier check
7. **Modified**: `src/routes/import/index.tsx` — Add `UrlImportInput`, reorder UI (URL top, file below)
8. **Modified**: `package.json` — Add `@anthropic-ai/sdk`

## Risks

- **Risk**: AI cost runaway if rate limits are bypassed or a single URL triggers excessive API calls.
  - **Impact**: Unexpected charges, operational burden.
  - **Mitigation**: Hard token limits (input truncation ≤8000 chars, max_tokens: 1024), per-user rate limit enforced server-side, monitoring/alerting on API costs (future).

- **Risk**: Schema.org parsing fails silently, user sees blank fields in preview.
  - **Impact**: Poor UX, user abandons import.
  - **Mitigation**: Validate extracted data against `importedRecipeSchema` before showing preview; if invalid, show error message with field details.

- **Risk**: Haiku extraction is too lossy (skips ingredients, instructions, etc.).
  - **Impact**: Imported recipes are incomplete, user experience degrades.
  - **Mitigation**: Haiku model is sufficient for recipe extraction (tested with a few URLs during design phase); if not, fall back to truncated HTML for human review or propose Sonnet (cost trade-off).

- **Risk**: URL fetch fails (timeout, SSL error, rate-limited by host).
  - **Impact**: User sees error but no recipe data to retry with.
  - **Mitigation**: Graceful error messages; user can try file import as fallback.

- **Risk**: Scope creeps during implementation (image downloading, multi-language support, etc.).
  - **Impact**: Delays shipping, increases AI costs.
  - **Mitigation**: Enforce out-of-scope list; if new requirements arise, update proposal/design/specs/tasks before apply continues.

## Open Questions

- **Question**: Should we cache the parsed recipe (before preview) so the user doesn't re-parse if they cancel/modify and re-submit?
  - **Needed from**: Product / Doug
  - **Blocker for apply**: No — v1 skips caching, each URL is re-fetched and re-parsed.

- **Question**: Should URL import have a different rate limit than file import? (file import has no per-user rate limit currently)
  - **Needed from**: Doug
  - **Blocker for apply**: No — file import will remain unlimited (no AI cost), URL import gets strict rate limit.

- **Question**: If Haiku fails to extract (returns garbage JSON or timeout), should we show a fallback UI with raw HTML preview?
  - **Needed from**: Doug / Product
  - **Blocker for apply**: No — v1 shows error message and suggests file import; raw HTML fallback is future work.

- **Question**: Should we log failed URL imports (for debugging / monitoring)?
  - **Needed from**: Doug
  - **Blocker for apply**: No — v1 logs errors to console; structured logging is future work.

## Non-Goals

- Bulk URL import (handle multiple URLs in one request)
- Image auto-download / Cloudinary re-hosting
- Recipe deduplication (user responsible for avoiding duplicates)
- Custom source / recipe origin tracking (can use notes field)
- Mobile file picker improvements
- Caching / memoization across sessions
- Internationalization (English-language AI responses only)
- Support for non-English recipe sites (best-effort, Schema.org parsing works globally)

## Change Control

**If scope changes after proposal approval**, update `proposal.md`, `design.md`, `specs/**/*.md`, and `tasks.md` before implementation starts. Scope changes include:
- Adding image download / Cloudinary integration
- Supporting multiple URLs in one request
- Changing rate limit strategy (per-user → per-IP, or per-hour → per-day, etc.)
- Changing AI model from Haiku to Sonnet/Opus
- Adding auth tier downgrades / reconciliation for imported recipes
- Adding caching across sessions
