import { useAuth } from './useAuth'
import {
  canCreatePrivate,
  canImport,
  getRecipeLimit,
  getCookbookLimit,
  TIER_ORDER,
  type EntitlementTier,
} from '@/lib/tier-entitlements'

function resolveEntitlementTier(tier?: string): EntitlementTier {
  if (tier && TIER_ORDER.includes(tier as EntitlementTier)) {
    return tier as EntitlementTier
  }
  return 'home-cook'
}

export function useTierEntitlements() {
  const { session } = useAuth()
  const tier = resolveEntitlementTier((session?.user as { tier?: string } | undefined)?.tier)

  return {
    tier,
    canCreatePrivate: canCreatePrivate(tier),
    canImport: canImport(tier),
    recipeLimit: getRecipeLimit(tier),
    cookbookLimit: getCookbookLimit(tier),
  }
}
