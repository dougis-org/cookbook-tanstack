export type UserTier = 'home-cook' | 'prep-cook' | 'sous-chef' | 'executive-chef'

export const TIER_RANK: Record<UserTier, number> = {
  'home-cook': 0,
  'prep-cook': 1,
  'sous-chef': 2,
  'executive-chef': 3,
}

export interface TierUser {
  tier?: UserTier
  isAdmin: boolean
}

/**
 * Returns true if the user meets or exceeds the required tier.
 * Admins always pass regardless of tier. Undefined tier is treated as 'home-cook'.
 */
export function hasAtLeastTier(user: TierUser, required: UserTier): boolean {
  if (user.isAdmin) return true
  return TIER_RANK[user.tier ?? 'home-cook'] >= TIER_RANK[required]
}
