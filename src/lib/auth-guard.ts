import { redirect } from '@tanstack/react-router'
import type { RouterContext } from '@/types/router'
import type { UserTier } from '@/types/user'
import { hasAtLeastTier } from '@/types/user'

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
    location: { href: string }
  }) => {
    if (!context.session) {
      throw redirect({
        to: '/auth/login',
        search: {
          reason: 'auth-required' as RedirectReason,
          from: location.href,
        },
      })
    }
  }
}

/**
 * Route guard factory. Usage: `beforeLoad: requireTier('sous-chef')`
 *
 * Reads `context.session.user.tier` and `context.session.user.isAdmin`.
 * Redirects logged-in users who don't meet the required tier to `/account`
 * with `reason: 'tier-limit-reached'`. Has no effect when session is null
 * (unauthenticated state is handled by `requireAuth`).
 */
export function requireTier(tier: UserTier) {
  return ({ context }: { context: RouterContext; location: { href: string } }) => {
    if (!context.session) return

    if (!hasAtLeastTier(context.session.user, tier)) {
      throw redirect({
        to: '/account',
        search: { reason: 'tier-limit-reached' as RedirectReason },
      })
    }
  }
}

/**
 * Route guard factory. Usage: `beforeLoad: requireAdmin()`
 *
 * Redirects non-admin users to `/account` with `reason: 'tier-limit-reached'`.
 * Has no effect when session is null (unauthenticated state is handled by `requireAuth`).
 *
 * @future No routes use this guard yet. It is implemented with real enforcement
 * logic so it is safe to wire up when an admin route is added.
 */
export function requireAdmin() {
  return ({ context }: { context: RouterContext; location: { href: string } }) => {
    if (!context.session) return

    if (!context.session.user.isAdmin) {
      throw redirect({
        to: '/account',
        search: { reason: 'tier-limit-reached' as RedirectReason },
      })
    }
  }
}

/**
 * Route guard factory. Usage: `beforeLoad: requireVerifiedAuth()`
 *
 * Combines auth + email verification checks. Unauthenticated users are redirected
 * to `/auth/login`. Authenticated-but-unverified users are redirected to
 * `/auth/verify-email?from=<path>`. Verified users pass through.
 *
 * Treats `emailVerified: undefined` as verified (legacy session compatibility).
 */
export function requireVerifiedAuth() {
  return ({
    context,
    location,
  }: {
    context: RouterContext
    location: { href: string }
  }) => {
    if (!context.session) {
      throw redirect({
        to: '/auth/login',
        search: {
          reason: 'auth-required' as RedirectReason,
          from: location.href,
        },
      })
    }

    if (context.session.user.emailVerified === false) {
      throw redirect({
        to: '/auth/verify-email',
        search: { from: location.href },
      })
    }
  }
}
