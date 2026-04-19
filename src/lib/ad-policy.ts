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

/**
 * Central ad eligibility policy.
 * Ads are only shown on public marketing/content pages for anonymous
 * or free (home-cook) non-admin users.
 */
export function isAdEligible(role: PageRole, session: AdEligibleSession | null): boolean {
  const adEnabledRoles: PageRole[] = ['public-marketing', 'public-content']
  if (!adEnabledRoles.includes(role)) return false

  // Anonymous users see ads on public pages
  if (!session) return true

  // Admins never see ads
  if (session.user.isAdmin) return false

  // Paid tiers do not see ads
  const tier = session.user.tier ?? 'home-cook'
  const paidTiers = ['prep-cook', 'sous-chef', 'executive-chef']
  
  return !paidTiers.includes(tier)
}
