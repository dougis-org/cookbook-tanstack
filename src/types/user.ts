export type UserTier = 'home-cook' | 'prep-cook' | 'sous-chef' | 'executive-chef'

export const TIER_RANK: Record<UserTier, number> = {
  'home-cook': 0,
  'prep-cook': 1,
  'sous-chef': 2,
  'executive-chef': 3,
}

export interface TierUser {
  tier?: UserTier | string | null
  isAdmin?: boolean | null
}

/**
 * Returns true if the user meets or exceeds the required tier.
 * Admins always pass regardless of tier. Null/undefined tier is treated as 'home-cook'.
 * Unrecognized tier strings are also treated as 'home-cook'.
 */
export function hasAtLeastTier(user: TierUser, required: UserTier): boolean {
  if (user.isAdmin) return true
  const tier = (user.tier ?? 'home-cook') as UserTier
  const rank = TIER_RANK[tier] ?? TIER_RANK['home-cook']
  return rank >= TIER_RANK[required]
}
