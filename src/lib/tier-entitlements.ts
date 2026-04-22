// Source of truth for all tier limit values: docs/user-tier-feature-sets.md
import { hasAtLeastTier, type UserTier } from '@/types/user'

export type EntitlementTier = UserTier | 'anonymous'

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
  return hasAtLeastTier({ tier }, 'sous-chef')
}
