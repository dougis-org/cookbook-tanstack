import { describe, it, expect, vi } from 'vitest'
import {
  requireAuth,
  requireTier,
  requireAdmin,
  requireVerifiedAuth,
  REDIRECT_REASON_MESSAGES,
} from '@/lib/auth-guard'
import { expectRedirect, testVerifiedAuthGuard } from '@/test-helpers/auth-guard'

vi.mock('@tanstack/react-router', async () => {
  const { createRouterMock } = await import('@/test-helpers/mocks')
  return createRouterMock()
})

const mockSession = {
  user: { id: 'user-1', email: 'test@example.com', name: 'Test User' },
  session: { id: 'session-1', userId: 'user-1', expiresAt: new Date() },
}

function makeSession(tier: string | undefined, isAdmin: boolean) {
  return {
    user: { id: 'user-1', email: 'test@example.com', tier, isAdmin },
    session: { id: 'session-1', userId: 'user-1', expiresAt: new Date() },
  }
}

describe('requireAuth()', () => {
  it('throws a redirect when session is null', () => {
    const guard = requireAuth()
    expectRedirect(guard, { session: null } as never, { href: '/recipes/new' }, '/auth/login', {
      reason: 'auth-required',
      from: '/recipes/new',
    })
  })

  it('from param is a relative path (starts with /) including query string', () => {
    const guard = requireAuth()
    expectRedirect(guard, { session: null } as never, { href: '/recipes?search=pasta' }, '/auth/login', {
      from: '/recipes?search=pasta',
    })
  })

  it('returns void (no throw) when session is non-null', () => {
    const guard = requireAuth()
    expect(() =>
      guard({
        context: { session: mockSession as never },
        location: { href: '/recipes/new' },
      }),
    ).not.toThrow()
  })
})

describe('requireTier()', () => {
  it('does not redirect when user tier exceeds required', () => {
    const guard = requireTier('sous-chef')
    expect(() =>
      guard({
        context: { session: makeSession('executive-chef', false) as never },
        location: { href: '/premium' },
      }),
    ).not.toThrow()
  })

  it('does not redirect on exact tier match', () => {
    const guard = requireTier('prep-cook')
    expect(() =>
      guard({
        context: { session: makeSession('prep-cook', false) as never },
        location: { href: '/premium' },
      }),
    ).not.toThrow()
  })

  it('throws redirect to /account when tier is insufficient', () => {
    const guard = requireTier('sous-chef')
    expectRedirect(
      guard,
      { session: makeSession('prep-cook', false) as never },
      { href: '/premium' },
      '/account',
      { reason: 'tier-limit-reached' },
    )
  })

  it('does not redirect when user is admin (admin bypass)', () => {
    const guard = requireTier('executive-chef')
    expect(() =>
      guard({
        context: { session: makeSession('home-cook', true) as never },
        location: { href: '/admin' },
      }),
    ).not.toThrow()
  })

  it('throws redirect when tier is undefined and requirement is elevated', () => {
    const guard = requireTier('prep-cook')
    expect(() =>
      guard({
        context: { session: makeSession(undefined, false) as never },
        location: { href: '/premium' },
      }),
    ).toThrow()
  })

  it('does not redirect when tier is undefined and requirement is home-cook', () => {
    const guard = requireTier('home-cook')
    expect(() =>
      guard({
        context: { session: makeSession(undefined, false) as never },
        location: { href: '/basic' },
      }),
    ).not.toThrow()
  })

  it('does not throw tier-limit-reached when session is null (auth guard handles unauthenticated)', () => {
    const guard = requireTier('prep-cook')
    try {
      guard({ context: { session: null } as never, location: { href: '/premium' } })
    } catch (e: unknown) {
      const redirected = e as { options: { search: { reason?: string } } }
      expect(redirected.options?.search?.reason).not.toBe('tier-limit-reached')
    }
  })
})

describe('requireAdmin()', () => {
  it('does not redirect for admin user', () => {
    const guard = requireAdmin()
    expect(() =>
      guard({
        context: { session: makeSession('home-cook', true) as never },
        location: { href: '/admin' },
      }),
    ).not.toThrow()
  })

  it('throws redirect to /account for non-admin user', () => {
    const guard = requireAdmin()
    expectRedirect(
      guard,
      { session: makeSession('executive-chef', false) as never },
      { href: '/admin' },
      '/account',
      { reason: 'tier-limit-reached' },
    )
  })
})

describe('requireVerifiedAuth()', () => {
  it('enforces verified authentication', () => {
    testVerifiedAuthGuard(requireVerifiedAuth(), '/recipes/new')
  })

  it('NFR-2: does not redirect when emailVerified is undefined (legacy session)', () => {
    const guard = requireVerifiedAuth()
    expect(() =>
      guard({
        context: { session: { user: { id: 'u1', emailVerified: undefined } } } as never,
        location: { href: '/recipes/new' },
      }),
    ).not.toThrow()
  })
})

describe('REDIRECT_REASON_MESSAGES', () => {
  it('has a non-empty string for auth-required', () => {
    expect(REDIRECT_REASON_MESSAGES['auth-required']).toBeTruthy()
  })

  it('has a non-empty string for tier-limit-reached', () => {
    expect(REDIRECT_REASON_MESSAGES['tier-limit-reached']).toBeTruthy()
  })
})
