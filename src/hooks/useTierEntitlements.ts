import { useAuth } from './useAuth'
import {
  can,
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
    canCreatePrivate: can('createPrivate', tier),
    canUsePrivateRecipeNotes: can('privateRecipeNotes', tier),
    canImport: can('import', tier),
    recipeLimit: getRecipeLimit(tier),
    cookbookLimit: getCookbookLimit(tier),
  }
}
