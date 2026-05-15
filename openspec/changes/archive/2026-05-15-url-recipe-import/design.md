## Context

- **Relevant architecture**:
  - tRPC mutations (recipes.import exists, will add recipes.importFromUrl)
  - React hooks (useTierEntitlements for access control)
  - AI extractor abstraction (new; `src/lib/ai-extractor.ts` with `AnthropicExtractor` using `@anthropic-ai/sdk`)
  - Server-side fetch for CORS avoidance
  - Existing ImportPreviewModal component (UI reuse)

- **Dependencies**:
  - @anthropic-ai/sdk (new)
  - Existing: zod, jsdom (testing), @tanstack/react-router, @tanstack/react-query

- **Interfaces/contracts touched**:
  - `importedRecipeSchema` (zod) — target shape for all imports (file + URL)
  - `canImport(tier)` — Executive Chef tier check
  - `useTierEntitlements()` hook — client-side entitlement display
  - tRPC recipes router — new `importFromUrl` mutation

## Goals / Non-Goals

### Goals

- Enable Executive Chef subscribers to import recipes from external URLs (AllRecipes, Serious Eats, etc.)
- Automatically extract and normalize recipe data using Schema.org markup (primary) and Claude Haiku (fallback)
- Cost-control: no more than $0.01 per URL import (Haiku only, token limits, truncation)
- Maintain existing file-based import flow (file import remains secondary but functional)
- Reuse existing ImportPreviewModal for unified UX
- Rate-limit URL imports (10/hour per user) to prevent runaway AI costs

### Non-Goals

- Image re-hosting (Cloudinary/S3) — images stored as URL strings
- Caching across sessions
- Bulk import (multiple URLs at once)
- Support for recipe sites without structured data (best-effort with Haiku; fallback to error)
- Internationalization (English-language AI responses only)

## Decisions

### Decision 1: Schema.org-First Parsing with Haiku Fallback

**Chosen**: Attempt Schema.org `ld+json` Recipe extraction first (free, fast). If not found or malformed, truncate HTML body and send to Claude Haiku (cost-controlled).

**Alternatives considered**:
- Haiku-only: Simpler code, but wastes AI costs on ~80% of recipes with structured data.
- Beautiful Soup / jsdom to parse HTML structure: Adds parsing logic complexity for diminishing returns (Schema.org covers most sites).

**Rationale**: 
- ~80% of major recipe sites embed Schema.org Recipe markup.
- Schema.org parse is deterministic, no AI cost.
- Haiku fallback catches sites without markup or extracts from raw HTML if needed.
- Keeps AI costs low and predictable.

**Trade-offs**: 
- Some sites have malformed `ld+json` (not valid JSON, or missing required fields). Haiku fallback mitigates but adds latency.
- Unstructured HTML extraction (via Haiku) is lossy; if Haiku fails, user gets an error and must try file import.

### Decision 2: Server-Side URL Fetch (No Client CORS)

**Chosen**: Server-side `fetch()` in tRPC mutation to fetch the URL. Client never directly fetches external URLs.

**Alternatives considered**:
- Client-side fetch with CORS proxy: Adds external dependency (CORS provider), security liability.
- Service worker with CORS: Complex, adds operational burden.

**Rationale**: 
- Avoids CORS headers negotiation.
- Single source of truth for URL fetch (easy rate limiting, logging, timeout enforcement).
- Reduces client bundle size (no extra HTTP client code).

**Trade-offs**: 
- Server must handle timeouts, redirects, certificate validation. Mitigated by short timeout (5s) and error handling.

### Decision 3: Per-User Rate Limiting (In-Process Map)

**Chosen**: In-process rate limiter: per-user rolling window (10 imports/hour). Stored in memory Map<userId, { count, windowStart }>. Simple, no DB required.

**Alternatives considered**:
- Redis rate limiter: Accurate across server restarts and load-balanced instances, but adds infrastructure.
- Database timestamp checks: Works, adds DB queries on every import.
- Per-IP rate limiting: Doesn't account for shared networks, less fair.

**Rationale**: 
- v1 is single-instance deployment (no load balancer).
- In-process is simplest to implement and debug.
- Resets on server restart (acceptable for v1).

**Trade-offs**: 
- Lost on server restart. Acceptable for v1; Redis upgrade is future work.
- Does not work if load-balanced (future: move to Redis).

**Implementation note**: Rate limiter extracted to `src/lib/rate-limiter.ts` for isolated testability and reuse across any future rate-limited endpoints.

### Decision 4: AI Provider Abstraction with Prompt Caching

**Chosen**: Define an `AIExtractor` interface in `src/lib/ai-extractor.ts`. The `AnthropicExtractor` concrete class implements it using `@anthropic-ai/sdk` with prompt caching on the system prompt. `recipe-url-import.ts` depends only on the interface, never on the Anthropic SDK directly.

**Interface**:
```ts
interface AIExtractor {
  extract(opts: { systemPrompt: string; userContent: string; maxOutputTokens: number }): Promise<string>
}
```

**`AnthropicExtractor` specifics**:
- Model: `claude-haiku-4-5-20251001` (v1 default; swappable by injecting a different implementation)
- Input truncation: ≤8000 chars of body text before sending
- Output: `max_tokens: 1024`
- Prompt caching: system prompt block marked `cache_control: { type: "ephemeral" }` — reused across calls, ~75% token cost reduction for repeat users

**Alternatives considered**:
- Direct `@anthropic-ai/sdk` in `recipe-url-import.ts`: Simpler short-term, but couples feature code to provider; blocks future switch to OpenAI, Gemini, or a local model.
- Haiku-only, no abstraction: Cheaper to write now, expensive to change later as the site adds more AI features.
- No prompt caching: Wastes tokens on the constant system prompt. Caching is zero extra complexity and saves real cost at scale.

**Rationale**:
- The site will use AI in more places; a shared `AIExtractor` abstraction amortizes provider changes.
- Prompt caching on a constant system prompt is low-effort and high-value regardless of which model runs behind it.
- Token limits still ensure cost predictability: input ≤8000 chars, max output 1024 tokens.

**Trade-offs**:
- One extra level of indirection. Negligible — the interface is a single method.

### Decision 5: Tier Gating (Executive Chef Only)

**Chosen**: Reuse existing `canImport(tier)` check (Executive Chef only). Same as file-based import. Server-side enforcement in tRPC mutation.

**Alternatives considered**:
- No tier gating: Free URL import for all. Doesn't meet business goal (drives Executive Chef conversion).
- Tier gating at Sous Chef+: Lowers barrier but reduces upgrade incentive.

**Rationale**: 
- URL import is the differentiator for Executive Chef tier.
- Matches existing file import tier gating.

**Trade-offs**: None significant.

### Decision 6: URL Import as Primary UI, File Import as Secondary

**Chosen**: `/import/` page layout: URL input at top (primary), file dropzone below (secondary). Same visual hierarchy as current, but inverted.

**Alternatives considered**:
- Tabbed interface (URL tab, File tab): More structure, but adds UI complexity.
- Separate pages (/import/url, /import/file): Routing complexity, splits user mental model.

**Rationale**: 
- Single page is simpler UX (one flow, one preview modal).
- Single-step URL input is faster than file upload + select.

**Trade-offs**: 
- Page is slightly longer (two input sections). Mitigation: collapsible file section or visual hierarchy (URL prominent, file smaller).

### Decision 7: Reuse Existing ImportPreviewModal

**Chosen**: `recipes.importFromUrl` mutation returns `ImportedRecipeInput` (same schema as file import). Reuse existing `ImportPreviewModal` for preview flow. No new modal component.

**Alternatives considered**:
- Custom modal for URL imports: Specific error messaging, better UX but duplicated code.
- Single generic modal: What we're doing (good).

**Rationale**: 
- No code duplication.
- Consistent UX (same preview, same confirm button).

**Trade-offs**: None significant.

### Decision 8: New Component UrlImportInput (Separate from Dropzone)

**Chosen**: Create `src/components/recipes/UrlImportInput.tsx` (distinct from `ImportDropzone.tsx`). UrlImportInput is text input + submit button. Clean separation of concerns.

**Alternatives considered**:
- Extend ImportDropzone to handle both: More complex, mixes concerns.
- Inline URL input in import/index.tsx: Less reusable, harder to test.

**Rationale**: 
- Single responsibility (UrlImportInput handles only URL logic).
- Easier to test in isolation.
- Easier to style independently.

**Trade-offs**: None significant.

### Decision 9: TierWall Reuse for UrlImportInput

**Chosen**: `UrlImportInput` does not render any upgrade UI itself. The import route (`src/routes/import/index.tsx`) already gates the entire import section on `canImport` and renders `<TierWall reason="import" display="inline" />` for unauthorized users. URL import slots into the same gate.

**Alternatives considered**:
- Custom "upgrade to Executive Chef" inline message in `UrlImportInput`: Duplicates messaging already in `TierWall`; two places to update when copy changes.

**Rationale**:
- `TierWall` already exists with an `'import'` reason and the correct messaging ("Import requires Executive Chef").
- The import route already uses `canImport` from `useTierEntitlements()` and renders `TierWall` inline — no new wiring needed.
- Consistent UX; single source of truth for tier messaging.

**Trade-offs**: None significant.

## Proposal to Design Mapping

| Proposal Element | Design Decision | Validation Approach |
|---|---|---|
| "Fetch HTML from URL" | Decision 2 (server-side fetch) | Integration test: mock fetch, verify tRPC mutation calls it |
| "Parse Schema.org ld+json" | Decision 1 (Schema.org first) | Unit test: JSON schema extraction; E2E: real AllRecipes URL |
| "AI normalization with low cost" | Decision 4 (AI abstraction, AnthropicExtractor + caching) | Unit test: mock AIExtractor, verify token limits passed; cost audit in design phase |
| "Reuse existing ImportPreviewModal" | Decision 7 (reuse modal) | Integration test: URL import + preview modal interaction |
| "Executive Chef tier only" | Decision 5 (tier gating) | Unit test: mutation rejects non-Executive Chef users |
| "Rate limit URL imports" | Decision 3 (in-process limiter) | Unit test: exceeding 10/hour throws error; mock clock to verify window reset |
| "URL import is primary UI" | Decision 6 (primary/secondary layout) | E2E test: URL input visible and focused on page load; file input below |

## Functional Requirements Mapping

| Requirement | Design Element | Acceptance Criteria Ref | Testability Notes |
|---|---|---|---|
| Fetch recipe from URL | Decision 2 (server-side fetch) | Spec AC-1 | Mock fetch in unit test; E2E with real AllRecipes URL |
| Extract Schema.org Recipe | Decision 1 (schema first) | Spec AC-2 | Unit test: feed JSON with Recipe @type, assert parsed fields |
| Normalize to ImportedRecipeInput | lib/recipe-url-import.ts | Spec AC-3 | Unit test: assert output passes importedRecipeSchema validation |
| Use Haiku fallback if no Schema.org | Decision 1 (fallback) | Spec AC-4 | Unit test: feed HTML with no ld+json, inject mock AIExtractor, assert extraction |
| Display URL input on page | Decision 6 (primary UI) | Spec AC-5 | E2E: screenshot, assert URL input visible and focused |
| Reuse ImportPreviewModal | Decision 7 (reuse modal) | Spec AC-6 | Integration test: URL submit → modal opens with parsed recipe |
| Enforce Executive Chef tier | Decision 5 (tier gating) | Spec AC-7 | Unit test: mock user with sous-chef tier, assert mutation throws PAYMENT_REQUIRED |
| Rate limit to 10/hour | Decision 3 (in-process limiter) | Spec AC-8 | Unit test: call 11 times in rapid succession, assert 11th fails |

## Non-Functional Requirements Mapping

| Category | Requirement | Design Element | Testability Notes |
|---|---|---|---|
| **Performance** | URL fetch latency ≤5s | Server fetch with 5s timeout | Integration test: slow endpoint, verify timeout error |
| **Performance** | Schema.org parse ≤100ms | In-process JSON parse (jsdom if needed) | Unit test: measure parse time on large ld+json block |
| **Performance** | Haiku call latency ≤10s | Anthropic SDK default timeout | Integration test: mock slow Haiku response, verify timeout |
| **Security** | Tier check before fetch | tRPC mutation enforces canImport | Unit test: unauthenticated / Sous Chef users rejected |
| **Reliability** | Malformed JSON ld+json caught | Try/catch + validation | Unit test: feed broken JSON, assert zod validation error |
| **Reliability** | Haiku timeout degraded gracefully | Error handling in mutation | Unit test: mock Haiku timeout, verify user-friendly error message |
| **Cost** | Input to Haiku ≤8000 chars | Truncate body text before sending | Unit test: verify truncation logic; audit actual token count |
| **Cost** | Haiku output ≤1024 tokens | Set max_tokens in Anthropic request | Unit test: mock response >1024 tokens, verify capping |
| **Operability** | Rate limit resets on window | Window-based (timestamp) reset | Unit test: advance clock, verify counter resets |

## Risks / Trade-offs

| Risk/Trade-off | Impact | Mitigation |
|---|---|---|
| Schema.org parse fails silently (malformed JSON, missing fields) | User sees incomplete recipe in preview | Zod validation before preview; error message if invalid |
| Haiku extraction is lossy or returns garbage | Imported recipe is incomplete or corrupted | Token limits + structured output reduce this; if Haiku times out, show error and suggest file import |
| URL fetch timeout (>5s) | User experience delay, perceived hang | 5s hard timeout; user sees clear error message |
| Rate limit blocks legitimate users | Frustration, support burden | Generous limit (10/hour); future: tier-based limits (higher for premium users) |
| In-process rate limiter lost on restart | Users can exceed limit after server restart | Acceptable for v1 (single instance); upgrade to Redis as traffic grows |
| Anthropic API key leaked / rate-limited by provider | Cascading failures, unexpected costs | Key stored in env vars; provider rate limits are very high (Haiku tier is low-priority but high limits); monitoring (future) |
| Schema.org Recipe with required field missing (e.g., no name) | Zod validation fails, user gets vague error | Error message lists missing fields (use zod.issues) |

## Rollback / Mitigation

**Rollback trigger**: 
- If AI costs exceed $X/day (set threshold during implementation; suggest $10/day)
- If error rate from URL import >10% (fetch fail, parse fail, validation fail)
- If users report broken imported recipes (missing ingredients, mangled instructions)

**Rollback steps**:
1. Disable `recipes.importFromUrl` mutation (remove from router or return error)
2. Revert `/import/` UI to file-only (remove UrlImportInput component)
3. Notify Executive Chef users via in-app banner: "URL import temporarily offline; file import still works"
4. Investigation / hotfix in separate PR

**Data migration considerations**:
- Imported recipes (from URLs or files) are immutable after creation.
- No data cleanup needed; recipes remain in DB regardless of rollback.
- No user-facing data loss.

**Verification after rollback**:
- File-based import still works (regression test)
- No errors in tRPC logs
- User can create recipes manually

## Operational Blocking Policy

**If CI checks fail**:
- Block merge. Return to developer for fixes.
- 2-day SLA for fixes or PR is closed.

**If security checks fail** (secret scanning, dependency audit):
- Block merge immediately.
- Escalate to security team if high-severity issue.
- No merge until resolved.

**If required reviews are blocked/stale**:
- Assign reminder comment after 3 days.
- Escalate to tech lead after 5 days.
- SLA: merge within 7 days of approval or close PR.

**Escalation path and timeout**:
- Developer (0 days): Author addresses feedback
- Tech lead (5 days): Unblock stuck reviews
- Product (10 days): If scope unclear, update proposal/design/tasks or close PR

## Open Questions

- Should we add user-agent spoofing (e.g., pretend to be a browser) to avoid site blocks? (Recommendation: v1 uses standard User-Agent; upgrade if sites block.)
- Should failed URL imports be logged to Sentry/monitoring? (Recommendation: v1 logs to console; structured logging is future work.)
- Should we support recipe-adjacent sites (blogs with embedded recipes)? (Recommendation: v1 supports only Schema.org Recipe; blogs with proper markup work automatically.)
