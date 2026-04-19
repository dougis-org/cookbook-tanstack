import { hasAtLeastTier, TierUser } from '@/types/user'

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

export function isAdEligible(role: PageRole, session: AdEligibleSession | null): boolean {
  if (!AD_ENABLED_ROLES.includes(role)) return false
  if (!session) return true
  if (session.user.isAdmin) return false
  return !hasAtLeastTier(session.user, 'prep-cook')
}
