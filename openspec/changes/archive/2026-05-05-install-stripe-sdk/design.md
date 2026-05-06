## Context

- **Relevant architecture**: TanStack Start with Nitro server, Vite bundler. Existing SDK singleton pattern at `src/lib/imagekit.ts` (lazy init, throw on missing env, server-side only).
- **Dependencies**: Stripe Node.js SDK (npm), environment variables (.env.local / deployed config).
- **Interfaces/contracts touched**: None currently (SDK is foundational; future billing logic will depend on it).

## Goals / Non-Goals

### Goals

- Install and configure Stripe SDK as a server-side singleton
- Document all required environment variables
- Establish server-side-only pattern (prevent client bundle leakage)
- Provide clear setup instructions for local sandbox development

### Non-Goals

- Implement checkout flow or subscription management
- Integrate Stripe.js (client-side payment UI)
- Build webhook server or handlers
- Create any API endpoints that use Stripe SDK

## Decisions

### Decision 1: Stripe SDK Version and API Version Pinning

- **Chosen**: Install `stripe@22.1.0`, pin SDK to API version `2026-04-22.dahlia`
- **Alternatives considered**:
  - Use `@latest` (avoid pinning) — too risky; breaks on future major versions
  - Pin to `22.0.x` (older stable) — `22.1.0` is current stable and well-tested
  - Use `22.2.0-alpha.3` (latest) — instability risk; alpha versions not recommended for production code
- **Rationale**: `22.1.0` is the latest stable release (2026-04-24), ships with `2026-04-22.dahlia` API version which aligns with current Stripe offerings. Pinning API version provides forward compatibility.
- **Trade-offs**: May need future maintenance to upgrade when Stripe deprecates older API versions; but explicit pinning makes upgrades intentional.

### Decision 2: Server-Side Singleton Pattern

- **Chosen**: Lazy-initialized singleton at `src/lib/stripe.ts`, following `src/lib/imagekit.ts` pattern
- **Alternatives considered**:
  - Factory function (new instance each time) — wastes resources, no caching benefit
  - Global static instance at module load — throws on missing env too early (not all code paths need Stripe)
  - Per-request initialization — violates the singleton pattern; inefficient
- **Rationale**: Lazy init defers error-throwing to first use. Singleton avoids repeated client instantiation. Pattern already proven in codebase with ImageKit.
- **Trade-offs**: Global singleton makes testing harder (requires mock reset between tests); but accepted trade-off for SDK clients.

### Decision 3: Environment Variable Convention

- **Chosen**: Use `VITE_STRIPE_PUBLISHABLE_KEY` (Vite convention), not `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (Next.js convention)
- **Alternatives considered**:
  - `STRIPE_PUBLISHABLE_KEY` (no prefix) — works but less explicit about exposure
  - `PUBLIC_STRIPE_PUBLISHABLE_KEY` — non-standard; confusing
- **Rationale**: Project is Vite-based, not Next.js. `VITE_` prefix explicitly signals to bundler that this var is safe to expose. Issue #422 template was copy-paste from Next.js; we correct it here.
- **Trade-offs**: Inconsistency with Next.js docs; but correct for this tech stack.

### Decision 4: Error Handling — Throw on Missing Secret Key

- **Chosen**: Throw immediately with clear message when `STRIPE_SECRET_KEY` is missing
- **Alternatives considered**:
  - Silent no-op (initialize empty client) — dangerous; fails silently when used
  - Warn at startup (app boot) — premature; not all code paths need Stripe
  - Return null/optional client — complicates usage throughout billing code
- **Rationale**: Clear, immediate error prevents silent failures. Lazy throw means only code paths that actually use Stripe see the error (efficient).
- **Trade-offs**: Developers must set env var before running billing code; but this is acceptable for server-side-only config.

### Decision 5: Price IDs as Environment Variables

- **Chosen**: Store all 6 price IDs (`STRIPE_PRICE_*`) in `.env.example`, consumed by future checkout/subscription logic
- **Alternatives considered**:
  - Hardcode price IDs in source code — inflexible; requires code change to swap tiers
  - Store in database — adds setup complexity; env vars sufficient for now
  - Create via API at runtime — Stripe API quota risk; not recommended
- **Rationale**: Price IDs are configuration (test vs production), not code. Env vars allow easy swaps between test/prod without rebuilding.
- **Trade-offs**: Requires manual Stripe dashboard setup to get IDs; but this is one-time onboarding.

## Proposal to Design Mapping

- **Proposal**: Install `stripe@22.1.0`
  - **Design decision**: Decision 1 (version pinning)
  - **Validation**: TypeScript compilation + production build succeeds; `stripe` package in node_modules
- **Proposal**: Server-side singleton at `src/lib/stripe.ts`
  - **Design decision**: Decision 2 (singleton pattern)
  - **Validation**: Manual test: call `getStripe()` in a server function; fails with clear error if `STRIPE_SECRET_KEY` missing
- **Proposal**: Fix GitHub issue #422 env naming
  - **Design decision**: Decision 3 (Vite convention)
  - **Validation**: Issue #422 body updated; documentation accurate
- **Proposal**: Add 9 env vars to `.env.example`
  - **Design decisions**: Decision 3 (naming), Decision 4 (secret key validation), Decision 5 (price IDs)
  - **Validation**: `.env.example` includes all 9 vars with clear comments

## Functional Requirements Mapping

- **Requirement**: Stripe SDK must be installed and accessible to server code
  - **Design element**: `src/lib/stripe.ts` singleton with `getStripe()` export
  - **Acceptance criteria**: `import { getStripe } from '@/lib/stripe'` works in server functions; TypeScript types resolve
  - **Testability notes**: Static type-check via `npx tsc --noEmit`; manual import test in a server file

- **Requirement**: Secret key must not leak to client bundle
  - **Design element**: Singleton only exported from `src/lib/stripe.ts`; never imported in client components
  - **Acceptance criteria**: Production build contains no `stripe` package code in client chunks; tree-shaking confirms
  - **Testability notes**: Run `npm run build`; inspect `.output/public` for absence of Stripe SDK files

- **Requirement**: Missing `STRIPE_SECRET_KEY` should produce clear error
  - **Design element**: Throw at first `getStripe()` call with message `"STRIPE_SECRET_KEY env var not set."`
  - **Acceptance criteria**: Error message is actionable; developer knows to add env var
  - **Testability notes**: Manual: call `getStripe()` without env var; confirm error text

## Non-Functional Requirements Mapping

- **Requirement category**: Security
  - **Requirement**: Stripe secret key must remain server-side only
  - **Design element**: Singleton pattern + TypeScript strict mode + no client imports
  - **Acceptance criteria**: Production build succeeds with zero Stripe SDK code in client bundle
  - **Testability notes**: Build analysis; grep client bundle for `stripe`

- **Requirement category**: Reliability
  - **Requirement**: SDK initialization must not fail silently
  - **Design element**: Throw on missing env; clear error message
  - **Acceptance criteria**: First use of `getStripe()` with missing key produces immediate error
  - **Testability notes**: Manual test without env var

- **Requirement category**: Operability
  - **Requirement**: Developer must know how to obtain Stripe keys and set them up
  - **Design element**: README.md section with Stripe CLI, webhook forwarding, test key instructions
  - **Acceptance criteria**: README covers: Stripe account creation, test mode, Stripe CLI, webhook secret, price ID setup
  - **Testability notes**: Manual read of README; verify all steps are clear

## Risks / Trade-offs

- **Risk**: API version `2026-04-22.dahlia` may be deprecated in future
  - **Impact**: Stripe breaking changes; code may need refactor
  - **Mitigation**: Document the pinned version clearly; upgrade path is a future issue

- **Risk**: Singleton makes testing harder (mock reset between tests)
  - **Impact**: Unit tests of SDK-dependent code need setup/teardown
  - **Mitigation**: Accept as trade-off; test frameworks (Vitest) provide cleanup hooks

- **Risk**: Developers misconfigure env vars locally
  - **Impact**: Confusing errors when running billing code without proper setup
  - **Mitigation**: Clear error message + README instructions guide developers through setup

## Rollback / Mitigation

- **Rollback trigger**: Stripe SDK proves incompatible or API breaks after merge
- **Rollback steps**:
  1. Delete `src/lib/stripe.ts`
  2. Remove `stripe` from `package.json`; run `npm install`
  3. Revert `.env.example` and `README.md` changes
  4. Revert GitHub issue #422 body
  5. Commit reversal PR
- **Data migration considerations**: None (SDK is foundational; no data written yet)
- **Verification after rollback**: TypeScript compilation succeeds; build succeeds

## Operational Blocking Policy

- **If CI checks fail**: Block merge until CI passes (TypeScript, build, lint)
- **If security checks fail** (e.g., secret key in code): Block merge; fix root cause before retrying
- **If required reviews are blocked/stale**: Author may ping reviewers after 48h; no auto-merge without explicit approval
- **Escalation path and timeout**: Slack #infrastructure for Stripe/SDK questions; escalate after 2 business days if review stuck

## Open Questions

- None at this time; design aligns with proposal and engineering constraints.
