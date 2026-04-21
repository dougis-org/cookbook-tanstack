import { TierUser } from '@/types/user'
import { EntitlementTier, TIER_LIMITS, showUserAds } from '@/lib/tier-entitlements'

export type PageRole =
  | 'public-marketing'
  | 'public-content'
  | 'authenticated-home'
  | 'authenticated-task'
  | 'auth'
  | 'admin'
  | 'account'
  | 'print'

export interface AdEligibleSession {
  user: TierUser
}

const AD_ENABLED_ROLES: PageRole[] = ['public-marketing', 'public-content']

export function isPageAdEligible(role: PageRole, session: AdEligibleSession | null): boolean {
  if (!AD_ENABLED_ROLES.includes(role)) return false
  if (!session) return showUserAds('anonymous')
  if (session.user.isAdmin) return false
  const raw = session.user.tier ?? 'home-cook'
  const tier: EntitlementTier = Object.hasOwn(TIER_LIMITS, raw) ? (raw as EntitlementTier) : 'home-cook'
  return showUserAds(tier)
}
