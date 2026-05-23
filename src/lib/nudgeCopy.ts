import { TIER_DISPLAY_NAMES, TIER_ORDER, TIER_PRICING, type EntitlementTier } from '@/lib/tier-entitlements'

/**
 * Returns the text for the soft nudge (70% - 89% capacity).
 */
export function getSoftNudgeText(count: number, limit: number, resourceName: string): string {
  const unit = resourceName === 'recipe' ? 'recipes' : 'cookbooks'
  return `You've saved ${count} of ${limit} ${unit}. Plenty of room to keep going.`
}

/**
 * Returns the text for the loud nudge (90% - 99% capacity).
 */
export function getLoudNudgeText(count: number, limit: number, tier: EntitlementTier, resourceName: string): string {
  const remaining = limit - count
  const unit = remaining === 1 ? resourceName : (resourceName === 'recipe' ? 'recipes' : 'cookbooks')
  const planName = TIER_DISPLAY_NAMES[tier]
  return `${remaining} ${unit} left on the ${planName} plan`
}

/**
 * Returns the CTA text for the loud nudge button.
 */
export function getLoudNudgeCTA(nextTier: EntitlementTier): string {
  const price = TIER_PRICING[nextTier]?.monthly
  if (price !== null && price !== undefined) {
    return `Upgrade — $${price}/mo`
  }
  return 'Upgrade'
}

/**
 * Helper to get the next tier in the hierarchy.
 */
export function getNextTier(currentTier: EntitlementTier): EntitlementTier | null {
  const currentIndex = TIER_ORDER.indexOf(currentTier)
  if (currentIndex === -1 || currentIndex >= TIER_ORDER.length - 1) {
    return null
  }
  return TIER_ORDER[currentIndex + 1]
}
