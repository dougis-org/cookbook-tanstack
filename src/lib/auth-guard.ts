import { redirect } from '@tanstack/react-router'
import type { RouterContext } from '@/types/router'

export type RedirectReason = 'auth-required' | 'tier-limit-reached'

export const REDIRECT_REASON_MESSAGES: Record<RedirectReason, string> = {
  'auth-required': 'You need to be signed in to access that page.',
  'tier-limit-reached': 'Upgrade your plan to access this feature.',
}

/**
 * Route guard factory. Usage: `beforeLoad: requireAuth()`
 *
 * Returns a beforeLoad-compatible function that reads `context.session` and
 * redirects unauthenticated users to `/auth/login` with `reason` and `from`
 * search params so the login page can show context and return the user.
 */
export function requireAuth() {
  return ({
    context,
    location,
  }: {
    context: RouterContext
    location: { pathname: string; search: string }
  }) => {
    if (!context.session) {
      throw redirect({
        to: '/auth/login',
        search: {
          reason: 'auth-required' as RedirectReason,
          from: location.pathname + (location.search ?? ''),
        },
      })
    }
  }
}

/**
 * @future requireTier(tier: UserTier)
 *
 * Will read `context.session.user.tier` and redirect already-logged-in users
 * to `/account` with `reason: 'tier-limit-reached'` when they lack the
 * required tier. Usage: `beforeLoad: requireTier('premium')`
 */
