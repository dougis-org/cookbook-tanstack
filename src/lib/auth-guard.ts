import { redirect } from '@tanstack/react-router'
import type { RouterContext } from '@/types/router'
import type { UserTier } from '@/types/user'
import { hasAtLeastTier } from '@/types/user'

export type RedirectReason = 'auth-required' | 'tier-limit-reached'

export const REDIRECT_REASON_MESSAGES: Record<RedirectReason, string> = {
  'auth-required': 'You need to be signed in to access that page.',
  'tier-limit-reached': 'Upgrade your plan to access this feature.',
}

function throwLoginRedirect(href: string): never {
  throw redirect({
    to: '/auth/login',
    search: { reason: 'auth-required' as RedirectReason, from: href },
  })
}

function throwAccountRedirect(reason: RedirectReason): never {
  throw redirect({
    to: '/account',
    search: { reason },
  })
}

type GuardArgs = { context: RouterContext; location: { href: string } }
type GuardFn = (args: GuardArgs) => void
type SessionGuardFn = (session: NonNullable<RouterContext['session']>, location: { href: string }) => void

/**
 * Higher-order guard that only executes if a session exists.
 * Does NOT redirect unauthenticated users (use withAuthenticatedSession for that).
 */
function withSession(fn: SessionGuardFn): GuardFn {
  return (args) => {
    if (!args.context.session) return
    fn(args.context.session, args.location)
  }
}

/**
 * Higher-order guard that requires an active session.
 * Redirects unauthenticated users to login.
 */
function withAuthenticatedSession(fn: SessionGuardFn): GuardFn {
  return (args) => {
    if (!args.context.session) throwLoginRedirect(args.location.href)
    fn(args.context.session, args.location)
  }
}

/**
 * Route guard factory. Usage: `beforeLoad: requireAuth()`
 *
 * Returns a beforeLoad-compatible function that reads `context.session` and
 * redirects unauthenticated users to `/auth/login` with `reason` and `from`
 * search params so the login page can show context and return the user.
 */
export function requireAuth() {
  return withAuthenticatedSession(() => {})
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
  return withSession((session) => {
    if (!hasAtLeastTier(session.user, tier)) {
      throwAccountRedirect('tier-limit-reached')
    }
  })
}

/**
 * Route guard factory. Usage: `beforeLoad: requireAdmin()`
 *
 * Redirects non-admin users to `/account` with `reason: 'tier-limit-reached'`.
 * Has no effect when session is null (unauthenticated state is handled by `requireAuth`).
 */
export function requireAdmin() {
  return withSession((session) => {
    if (!session.user.isAdmin) {
      throwAccountRedirect('tier-limit-reached')
    }
  })
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
  return withAuthenticatedSession((session, location) => {
    if (session.user.emailVerified === false) {
      throw redirect({
        to: '/auth/verify-email',
        search: { from: location.href },
      })
    }
  })
}
