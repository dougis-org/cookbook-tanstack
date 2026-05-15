# Tasks

## T1 — Fix stale tier-entitlements spec

Update `openspec/specs/tier-entitlements/spec.md`: the `canImport` requirement incorrectly states `sous-chef` and above. The implementation already requires `executive-chef`. This was resolved in the artifact update step — no code changes needed.

- [x] **Verify `canImport` spec** says `executive-chef` only; `sous-chef` listed as a blocked tier in `openspec/specs/tier-entitlements/spec.md`

---

## T2 — RateLimiter: tests then implementation

**Spec**: `specs/rate-limiter.md`

- [x] **Write tests** `src/lib/__tests__/rate-limiter.test.ts`: unknown key allowed; 9 uses allowed; 10 uses blocked; expired window resets; `record` increments; `urlImportRateLimiter` singleton blocks on 11th call
- [x] **Implement** `src/lib/rate-limiter.ts`: `RateLimiter(limit, windowMs)` with `check(key): boolean` / `record(key): void` using `Map<string, { count: number; windowStart: number }>`; export `urlImportRateLimiter = new RateLimiter(10, 60 * 60 * 1000)`
- [x] **Verify** `npx vitest run src/lib/__tests__/rate-limiter.test.ts` passes

---

## T3 — AIExtractor: tests then interface + AnthropicExtractor

**Spec**: `specs/ai-extractor.md`

- [x] **Add** `@anthropic-ai/sdk` to `package.json` and run `npm install`
- [x] **Write tests** `src/lib/__tests__/ai-extractor.test.ts`: factory throws on missing key; `extract` sends `cache_control: { type: "ephemeral" }` on system prompt; `max_tokens` passed through; model is `claude-haiku-4-5-20251001`; returns text from first content block; SDK errors propagate — mock `@anthropic-ai/sdk`, no real API calls
- [x] **Implement** `src/lib/ai-extractor.ts`: `AIExtractor` interface; `AnthropicExtractor implements AIExtractor`; `createAnthropicExtractor()` factory that reads `ANTHROPIC_API_KEY` from env and throws if missing
- [x] **Verify** `npx vitest run src/lib/__tests__/ai-extractor.test.ts` passes and `npm run build` succeeds

---

## T4 — URL import pipeline: tests then implementation

**Spec**: `specs/url-import-pipeline.md`

- [x] **Write tests** `src/lib/__tests__/recipe-url-import.test.ts`: Schema.org path (valid ld+json → result, extractor not called); multiple ld+json blocks (first Recipe used); AI fallback (no ld+json → truncated HTML sent to extractor); Schema.org fails validation → falls through to AI; `isPublic: true` on all paths; fetch timeout → TRPCError; non-2xx → TRPCError; network error → TRPCError; AI returns invalid JSON → TRPCError; AI JSON fails schema → TRPCError listing issues; body >8000 chars truncated — mock `fetch`, inject mock `AIExtractor`
- [x] **Implement** `src/lib/recipe-url-import.ts`: `fetchAndNormalizeRecipe(url, extractor)` with AbortController 5s timeout; body text extraction + truncation to 8000 chars; Schema.org `ld+json` extraction with `importedRecipeSchema` validation; AI fallback with JSON parse + schema validation; force `isPublic: true`
- [x] **Verify** `npx vitest run src/lib/__tests__/recipe-url-import.test.ts` passes

---

## T5 — tRPC mutation: tests then implementation

- [x] **Write tests** `src/server/trpc/routers/__tests__/recipe-url-import.test.ts`: non-executive-chef → `PAYMENT_REQUIRED`; unauthenticated → `UNAUTHORIZED`; 11th call same user → rate limit error; valid Executive Chef + valid URL → calls pipeline, saves recipe, returns `{ id }`; pipeline error propagated — mock `fetchAndNormalizeRecipe` and `AIExtractor`
- [x] **Implement** `recipes.importFromUrl` mutation in `src/server/trpc/routers/recipes.ts`: `protectedProcedure` with `z.object({ url: z.string().url() })` input; `canImport` check → `PAYMENT_REQUIRED`; `urlImportRateLimiter.check` → `TOO_MANY_REQUESTS`; `record`; call `fetchAndNormalizeRecipe`; save recipe (reuse existing `recipes.import` save logic); return `{ id }`
- [x] **Verify** `npx vitest run src/server/trpc/routers/__tests__/recipe-url-import.test.ts` passes

---

## T6 — UrlImportInput component: tests then implementation

- [x] **Write tests** `src/components/recipes/__tests__/UrlImportInput.test.tsx`: renders URL input + submit button; empty/whitespace URL → `onSubmit` not called; valid URL → `onSubmit` called with trimmed URL; `isPending: true` → button disabled + loading state; `error` prop → error message rendered
- [x] **Implement** `src/components/recipes/UrlImportInput.tsx`: props `{ onSubmit: (url: string) => void; isPending: boolean; error?: string | null }`; controlled input; no tier check (tier wall is the route's responsibility)
- [x] **Verify** `npx vitest run src/components/recipes/__tests__/UrlImportInput.test.tsx` passes

---

## T7 — Update import route

- [x] **Write/update tests** `src/routes/__tests__/-import.test.tsx`: URL input visible above file section; `canImport = false` → TierWall shown, no inputs; URL submit → `importFromUrl` mutation called → modal opens; modal confirm → `recipes.import` → navigate; file import regression (select file → modal → confirm → navigate); `importFromUrl` error → displayed in `UrlImportInput`
- [x] **Update** `src/routes/import/index.tsx`: add `importFromUrlMutation`; add `<UrlImportInput>` above `<ImportDropzone>`; URL submit handler sets `parsedRecipe` on success; both URL and file paths share `parsedRecipe` state and `ImportPreviewModal`
- [x] **Verify** `npx vitest run src/routes/__tests__/-import.test.tsx` passes

---

## T8 — E2E test: full URL import flow

- [x] **Write** `e2e/import-url.spec.ts`: sign in as Executive Chef; navigate `/import/`; verify URL input visible above file dropzone; paste URL (fixture/mock server with Schema.org HTML); submit → `ImportPreviewModal` opens with recipe title; confirm → redirect to `/recipes/:id`; recipe page shows title
- [x] **Write regression** in same file: return to `/import/`, select valid `.json` export → modal opens → confirm → redirected
- [x] **Verify** `npm run test:e2e` passes
