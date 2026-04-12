import { describe, it, expect } from 'vitest'
import { redirect } from '@tanstack/react-router'
import { requireAuth, REDIRECT_REASON_MESSAGES } from '@/lib/auth-guard'

const mockSession = {
  user: { id: 'user-1', email: 'test@example.com', name: 'Test User' },
  session: { id: 'session-1', userId: 'user-1', expiresAt: new Date() },
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

describe('REDIRECT_REASON_MESSAGES', () => {
  it('has a non-empty string for auth-required', () => {
    expect(REDIRECT_REASON_MESSAGES['auth-required']).toBeTruthy()
  })

  it('has a non-empty string for tier-limit-reached', () => {
    expect(REDIRECT_REASON_MESSAGES['tier-limit-reached']).toBeTruthy()
  })
})
