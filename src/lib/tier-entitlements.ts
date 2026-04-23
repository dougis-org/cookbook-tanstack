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
  'sous-chef': 'Unlock private recipes, import tools, and room for 500 recipes and 25 cookbooks.',
  'executive-chef': 'The full CookBook experience — 2500 recipes, 200 cookbooks, and every feature.',
}
