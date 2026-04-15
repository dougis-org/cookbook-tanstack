import { describe, it, expect } from 'vitest'
import { redirect } from '@tanstack/react-router'
import { requireAuth, requireTier, requireAdmin, REDIRECT_REASON_MESSAGES } from '@/lib/auth-guard'

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
    expect(() =>
      guard({ context: { session: null }, location: { href: '/recipes/new' } }),
    ).toThrow()
  })

  it('thrown redirect targets /auth/login', () => {
    const guard = requireAuth()
    let thrown: unknown
    try {
      guard({ context: { session: null }, location: { href: '/recipes/new' } })
    } catch (e) {
      thrown = e
    }
    // TanStack Router redirect objects store navigate options in `.options`
    expect((thrown as ReturnType<typeof redirect>).options.to).toBe('/auth/login')
  })

  it('thrown redirect search contains reason: auth-required', () => {
    const guard = requireAuth()
    let thrown: unknown
    try {
      guard({ context: { session: null }, location: { href: '/recipes/new' } })
    } catch (e) {
      thrown = e
    }
    expect((thrown as ReturnType<typeof redirect>).options.search).toMatchObject({
      reason: 'auth-required',
    })
  })

  it('thrown redirect search contains from equal to the location href', () => {
    const guard = requireAuth()
    let thrown: unknown
    try {
      guard({ context: { session: null }, location: { href: '/recipes/new' } })
    } catch (e) {
      thrown = e
    }
    expect((thrown as ReturnType<typeof redirect>).options.search).toMatchObject({
      from: '/recipes/new',
    })
  })

  it('from param is a relative path (starts with /) including query string', () => {
    const guard = requireAuth()
    let thrown: unknown
    try {
      guard({ context: { session: null }, location: { href: '/recipes?search=pasta' } })
    } catch (e) {
      thrown = e
    }
    const search = (thrown as ReturnType<typeof redirect>).options.search as unknown as Record<string, string>
    const from = search?.from
    expect(from).toMatch(/^\//)
    expect(from).not.toContain('http')
    expect(from).toBe('/recipes?search=pasta')
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
    let thrown: unknown
    try {
      guard({
        context: { session: makeSession('prep-cook', false) as never },
        location: { href: '/premium' },
      })
    } catch (e) {
      thrown = e
    }
    expect((thrown as ReturnType<typeof redirect>).options.to).toBe('/account')
  })

  it('redirect contains reason: tier-limit-reached', () => {
    const guard = requireTier('sous-chef')
    let thrown: unknown
    try {
      guard({
        context: { session: makeSession('prep-cook', false) as never },
        location: { href: '/premium' },
      })
    } catch (e) {
      thrown = e
    }
    expect((thrown as ReturnType<typeof redirect>).options.search).toMatchObject({
      reason: 'tier-limit-reached',
    })
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
    // When there's no session, requireTier should not throw tier-limit-reached
    // (requireAuth handles unauthenticated state)
    let thrown: unknown
    try {
      guard({ context: { session: null }, location: { href: '/premium' } })
    } catch (e) {
      thrown = e
    }
    if (thrown) {
      const redirected = thrown as ReturnType<typeof redirect>
      const search = redirected.options.search as unknown as Record<string, string>
      expect(search?.reason).not.toBe('tier-limit-reached')
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
    let thrown: unknown
    try {
      guard({
        context: { session: makeSession('executive-chef', false) as never },
        location: { href: '/admin' },
      })
    } catch (e) {
      thrown = e
    }
    expect((thrown as ReturnType<typeof redirect>).options.to).toBe('/account')
  })

  it('redirect for non-admin contains reason: tier-limit-reached', () => {
    const guard = requireAdmin()
    let thrown: unknown
    try {
      guard({
        context: { session: makeSession('executive-chef', false) as never },
        location: { href: '/admin' },
      })
    } catch (e) {
      thrown = e
    }
    expect((thrown as ReturnType<typeof redirect>).options.search).toMatchObject({
      reason: 'tier-limit-reached',
    })
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
