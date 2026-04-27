import { useAuth } from './useAuth'
import {
  canCreatePrivate,
  canImport,
  getRecipeLimit,
  getCookbookLimit,
  type EntitlementTier,
} from '@/lib/tier-entitlements'

export function useTierEntitlements() {
  const { session } = useAuth()
  const tier = ((session?.user as { tier?: string } | undefined)?.tier ?? 'home-cook') as EntitlementTier

  return {
    tier,
    canCreatePrivate: canCreatePrivate(tier),
    canImport: canImport(tier),
    recipeLimit: getRecipeLimit(tier),
    cookbookLimit: getCookbookLimit(tier),
  }
}
