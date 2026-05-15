---
name: tests
description: Test cases for the url-recipe-import change — all tests implemented and passing
---

# Tests

## Overview

All tests were written following TDD: tests first, then implementation. All test files pass as of PR #445 (merged).

## Test Cases

### T2 — RateLimiter (`src/lib/__tests__/rate-limiter.test.ts`)

- [x] Unknown key is allowed (returns `true`)
- [x] 9 uses within window are allowed
- [x] 10th use within window is blocked (returns `false`)
- [x] Expired window resets counter and allows again
- [x] `record()` increments count correctly
- [x] `urlImportRateLimiter` singleton blocks on 11th call within window

### T3 — AIExtractor (`src/lib/__tests__/ai-extractor.test.ts`)

- [x] `createAnthropicExtractor()` throws when `ANTHROPIC_API_KEY` is not set
- [x] `extract()` sends `cache_control: { type: "ephemeral" }` on the system prompt message
- [x] `max_tokens` is passed through to the API call
- [x] Model is `claude-haiku-4-5-20251001`
- [x] Returns text from the first content block
- [x] SDK errors propagate as-is (no swallowing)

### T4 — URL import pipeline (`src/lib/__tests__/recipe-url-import.test.ts`)

- [x] Valid Schema.org ld+json → result returned, AI extractor not called
- [x] Multiple ld+json blocks → first `@type: "Recipe"` block used
- [x] No ld+json → AI fallback called with truncated HTML body
- [x] Schema.org data fails `importedRecipeSchema` validation → falls through to AI
- [x] All paths force `isPublic: true` on the result
- [x] Fetch timeout (AbortController 5s) → `TRPCError` with timeout message
- [x] Non-2xx HTTP response → `TRPCError`
- [x] Network error → `TRPCError`
- [x] AI returns invalid JSON → `TRPCError`
- [x] AI JSON fails schema validation → `TRPCError` listing field issues
- [x] Body >8000 characters is truncated before sending to AI

### T5 — tRPC mutation (`src/server/trpc/routers/__tests__/recipe-url-import.test.ts`)

- [x] Non-executive-chef tier → `PAYMENT_REQUIRED`
- [x] Unauthenticated request → `UNAUTHORIZED`
- [x] 11th call from same user within window → rate limit error (`TOO_MANY_REQUESTS`)
- [x] Valid Executive Chef + valid URL → pipeline called, recipe saved, `{ id }` returned
- [x] Pipeline error propagates to caller

### T6 — UrlImportInput component (`src/components/recipes/__tests__/UrlImportInput.test.tsx`)

- [x] Renders URL input and submit button
- [x] Empty URL → `onSubmit` not called
- [x] Whitespace-only URL → `onSubmit` not called
- [x] Valid URL (with surrounding whitespace) → `onSubmit` called with trimmed value
- [x] `isPending: true` → button disabled + loading indicator shown
- [x] `error` prop provided → error message rendered in alert
- [x] `error` prop null/undefined → no alert rendered
- [x] URL input cleared after successful submit

### T7 — Import route (`src/routes/__tests__/-import.test.tsx`)

- [x] URL input visible above file dropzone section
- [x] `canImport = false` → TierWall shown, no URL input or file dropzone rendered
- [x] URL submit → `importFromUrl` mutation called → `ImportPreviewModal` opens with recipe data
- [x] Modal confirm → `recipes.import` called → navigate to recipe page
- [x] File import regression: select file → modal opens → confirm → redirected
- [x] `importFromUrl` error → error message displayed in `UrlImportInput`

### T8 — E2E: full URL import flow (`src/e2e/import-url.spec.ts`)

- [x] Sign in as Executive Chef → navigate `/import/` → URL input visible above file dropzone
- [x] Paste URL (Schema.org fixture) → submit → `ImportPreviewModal` opens with recipe title
- [x] Confirm modal → redirect to `/recipes/:id` → recipe page shows title
- [x] Regression: return to `/import/`, select valid `.json` export → modal opens → confirm → redirected
