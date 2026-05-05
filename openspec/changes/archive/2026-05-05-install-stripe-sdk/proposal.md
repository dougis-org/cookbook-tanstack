## GitHub Issues

- #422

## Why

- **Problem statement**: The app has a tiered subscription model (prep-cook, sous-chef, executive-chef) but no payment infrastructure. Stripe SDK is the prerequisite for all billing features (checkout, subscriptions, webhooks).
- **Why now**: Multiple billing-related issues (#422+) are queued and blocked on this foundational work. Better to unblock them now than accumulate technical debt.
- **Business/user impact**: Without Stripe configured, the app cannot monetize premium tiers or process payments. This is blocking the go-to-market path for the subscription model.

## Problem Space

- **Current behavior**: The app has tier definitions and access control logic, but no Stripe account integration or payment processing.
- **Desired behavior**: Stripe SDK is installed, configured with a server-side singleton, and ready for billing logic (checkout flows, subscription management, webhook handling).
- **Constraints**:
  - This is a Vite/TanStack Start project, not Next.js — must use `VITE_*` env convention, not `NEXT_PUBLIC_*`
  - Server-side Stripe secret key must NEVER leak to client bundle
  - GitHub issue #422 uses wrong env naming convention (copy-paste from Next.js template)
- **Assumptions**:
  - Stripe 22.1.0 (latest stable) is acceptable and will remain compatible through Q2 2026
  - Environment variables are the correct place for Stripe keys (not hardcoded in config files)
  - Singleton pattern from `src/lib/imagekit.ts` is the established pattern for SDK clients in this project
- **Edge cases considered**:
  - Missing `STRIPE_SECRET_KEY` should throw clearly rather than silently fail
  - The publishable key (`VITE_STRIPE_PUBLISHABLE_KEY`) is documented but not consumed yet (no Stripe.js frontend integration in this issue)
  - Price IDs are configuration, not hardcoded (will be consumed by future checkout/subscription logic)

## Scope

### In Scope

- Install `stripe@22.1.0` npm package
- Create `src/lib/stripe.ts` — server-side singleton (lazy init, throws on missing env)
- Pin SDK to API version `2026-04-22.dahlia`
- Add 9 environment variables to `.env.example`:
  - `STRIPE_SECRET_KEY` (server-side)
  - `VITE_STRIPE_PUBLISHABLE_KEY` (client-safe)
  - `STRIPE_WEBHOOK_SECRET` (for webhook verification)
  - 6 price IDs (monthly/annual × 3 tiers)
- Fix GitHub issue #422 body: replace `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` with `VITE_STRIPE_PUBLISHABLE_KEY`
- Add Stripe sandbox setup instructions to README.md (Stripe CLI, webhook forwarding)
- Verify via TypeScript type-check and production build that Stripe SDK is server-side only (no client bundle leakage)

### Out of Scope

- Stripe.js integration (client-side payment element) — future issue
- Webhook server implementation (`/api/webhooks/stripe`) — future issue
- Checkout flow or subscription management logic — future issues
- Stripe account creation or test mode setup (user responsibility)
- Integration tests requiring actual Stripe API calls (use mock in future tests)

## What Changes

1. **package.json**: Add `stripe@22.1.0`
2. **src/lib/stripe.ts**: New singleton following ImageKit pattern
3. **.env.example**: Document all 9 Stripe env vars with help text
4. **README.md**: Add Stripe sandbox setup section (Stripe CLI, webhook secret)
5. **GitHub issue #422**: Fix naming convention in issue body

## Risks

- **Risk**: Stripe SDK version mismatch or API deprecation
  - **Impact**: Breaking changes if Stripe API version `2026-04-22.dahlia` is no longer supported
  - **Mitigation**: Pin to stable release (22.1.0); document the API version clearly so future refactors can update it with intent
- **Risk**: Secret key leaked to client bundle
  - **Impact**: Attacker gains full Stripe API access
  - **Mitigation**: Use TypeScript strict mode + tree-shaking verification in production build; throw on missing env at initialization; never import in client code
- **Risk**: Incomplete or missing env vars in local/prod environment
  - **Impact**: Silent failures or runtime errors when Stripe features are first used
  - **Mitigation**: Singleton throws clearly with helpful error message; README documents all required vars

## Open Questions

- **Question**: Should the `VITE_STRIPE_PUBLISHABLE_KEY` be defined in `.env.local` for local development, or is it only needed when Stripe.js is integrated (future PR)?
  - **Needed from**: You (designer/requester)
  - **Blocker for apply**: No — we document it in `.env.example` either way, but clarity helps future PRs

## Non-Goals

- Don't create any API endpoints or webhook handlers
- Don't add client-side Stripe.js library
- Don't implement checkout or subscription logic
- Don't write integration tests against live Stripe API (mock Stripe in tests)
- Don't enforce Stripe key validation at startup (throw when actually needed, not at app boot)

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`, `specs/**/*.md`, and `tasks.md` before implementation starts.
