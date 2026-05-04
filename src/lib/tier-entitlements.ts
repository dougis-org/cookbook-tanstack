// Source of truth for all tier limit values: docs/user-tier-feature-sets.md
import { hasAtLeastTier, type UserTier } from '@/types/user'

export type EntitlementTier = UserTier | 'anonymous'

// ─── Enforcement Contract ───────────────────────────────────────────────────
//
// Tier enforcement spans three distinct layers with a strict separation of
// concerns:
//
// 1. Server enforcement (this module + tRPC routers)
//    All tier-limit and boolean-capability checks live in tRPC route handlers.
//    No tier enforcement logic exists outside the routers and this module.
//
// 2. Client hook for UI affordances only (src/hooks/useTierEntitlements.ts)
//    The client-side hook surfaces tier entitlements for UI display (e.g.,
//    disabling buttons, showing upgrade prompts). It is never used for access
//    control — the server is the source of truth and will reject unauthorized
//    requests regardless of what the client hook reports.
//
// 3. Reconciliation on tier downgrade (src/lib/reconcile-user-content.ts)
//    When an admin changes a user's tier downward, reconcile-user-content.ts
//    retroactively applies the new limits by setting hiddenByTier on excess
//    documents. This runs server-side and is triggered by admin.users.setTier.
//
// ─────────────────────────────────────────────────────────────────────────────

export const TIER_LIMITS: Record<EntitlementTier, { recipes: number; cookbooks: number }> = {
  anonymous: { recipes: 0, cookbooks: 0 },
  'home-cook': { recipes: 10, cookbooks: 1 },
  'prep-cook': { recipes: 100, cookbooks: 10 },
  'sous-chef': { recipes: 500, cookbooks: 25 },
  'executive-chef': { recipes: 2500, cookbooks: 200 },
}

export function getRecipeLimit(tier: EntitlementTier): number {
  return TIER_LIMITS[tier].recipes
}

export function getCookbookLimit(tier: EntitlementTier): number {
  return TIER_LIMITS[tier].cookbooks
}

export function showUserAds(tier: EntitlementTier): boolean {
  return tier === 'anonymous' || tier === 'home-cook'
}

export function canCreatePrivate(tier: string | null | undefined): boolean {
  return hasAtLeastTier({ tier }, 'sous-chef')
}

export function canImport(tier: string | null | undefined): boolean {
  return hasAtLeastTier({ tier }, 'executive-chef')
}

export const TIER_ORDER: EntitlementTier[] = [
  'anonymous',
  'home-cook',
  'prep-cook',
  'sous-chef',
  'executive-chef',
]

export const TIER_DISPLAY_NAMES: Record<EntitlementTier, string> = {
  anonymous: 'Anonymous',
  'home-cook': 'Home Cook',
  'prep-cook': 'Prep Cook',
  'sous-chef': 'Sous Chef',
  'executive-chef': 'Executive Chef',
}

export const TIER_DESCRIPTIONS: Record<EntitlementTier, string> = {
  anonymous: 'Browse public recipes without an account.',
  'home-cook': 'Start your collection with up to 10 recipes and 1 cookbook.',
  'prep-cook': 'Grow your library with up to 100 recipes and 10 cookbooks.',
  'sous-chef': 'Unlock private recipes and room for 500 recipes and 25 cookbooks.',
  'executive-chef': 'The full CookBook experience — 2500 recipes, 200 cookbooks, and every feature.',
}

export const TIER_PRICING: Record<EntitlementTier, { annual: number | null; monthly: number | null }> = {
  'anonymous': { annual: null, monthly: null },
  'home-cook': { annual: null, monthly: null },
  'prep-cook': { annual: 27.99, monthly: 2.99 },
  'sous-chef': { annual: 59.99, monthly: 5.99 },
  'executive-chef': { annual: 99.99, monthly: 9.99 },
}
