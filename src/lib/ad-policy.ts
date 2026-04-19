export type PageRole =
  | 'public-marketing'
  | 'public-content'
  | 'authenticated-home'
  | 'authenticated-task'
  | 'auth'
  | 'admin'
  | 'account'
  | 'print'

import { TIER_RANK, TierUser } from '@/types/user'

export interface AdEligibleSession {
  user: TierUser
}

const AD_ENABLED_ROLES: PageRole[] = ['public-marketing', 'public-content']

export function isAdEligible(role: PageRole, session: AdEligibleSession | null): boolean {
  if (!AD_ENABLED_ROLES.includes(role)) return false
  if (!session) return true
  if (session.user.isAdmin) return false

  const tier = (session.user.tier ?? 'home-cook') as keyof typeof TIER_RANK
  const rank = TIER_RANK[tier] ?? TIER_RANK['home-cook']
  return rank === TIER_RANK['home-cook']
}
