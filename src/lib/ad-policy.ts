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
  user: {
    tier?: string | null
    isAdmin?: boolean | null
  }
}

const AD_ENABLED_ROLES: PageRole[] = ['public-marketing', 'public-content']
const PAID_TIERS = ['prep-cook', 'sous-chef', 'executive-chef']

/**
 * Central ad eligibility policy.
 * Ads are only shown on public marketing/content pages for anonymous
 * or free (home-cook) non-admin users. Missing or unknown tiers are 
 * treated as home-cook for eligibility.
 */
export function isAdEligible(role: PageRole, session: AdEligibleSession | null): boolean {
  if (!AD_ENABLED_ROLES.includes(role)) return false

  // Anonymous users see ads on public pages
  if (!session) return true

  // Admins never see ads
  if (session.user.isAdmin) return false

  // Paid tiers do not see ads
  const tier = session.user.tier ?? 'home-cook'
  
  return !PAID_TIERS.includes(tier)
}
