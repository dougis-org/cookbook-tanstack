import { describe, it, expect, vi } from 'vitest'

vi.mock('@tanstack/react-router', async () => {
  const { createRouterMock } = await import('@/test-helpers/mocks')
  return createRouterMock()
})

vi.mock('@/components/layout/PageLayout', () => ({ default: () => null }))
vi.mock('@/components/recipes/RecipeForm', () => ({ default: () => null }))

import { Route } from '@/routes/recipes/new'

describe('/recipes/new — beforeLoad', () => {
  it('redirects unauthenticated visitors to /auth/login', () => {
    const beforeLoad = Route.options.beforeLoad
    if (!beforeLoad) throw new Error('beforeLoad not defined')
    try {
      beforeLoad({ context: { session: null }, location: { href: '/recipes/new' } } as never)
      throw new Error('Should have thrown')
    } catch (err: unknown) {
      const e = err as { type?: string; options?: { to?: string; search?: { reason?: string } } }
      expect(e.type).toBe('redirect')
      expect(e.options?.to).toBe('/auth/login')
      expect(e.options?.search).toMatchObject({ reason: 'auth-required' })
    }
  })

  it('redirects authenticated-but-unverified users to /auth/verify-email', () => {
    const beforeLoad = Route.options.beforeLoad
    if (!beforeLoad) throw new Error('beforeLoad not defined')
    try {
      beforeLoad({ context: { session: { user: { id: 'u1', emailVerified: false } } }, location: { href: '/recipes/new' } } as never)
      throw new Error('Should have thrown')
    } catch (err: unknown) {
      const e = err as { type?: string; options?: { to?: string } }
      expect(e.type).toBe('redirect')
      expect(e.options?.to).toBe('/auth/verify-email')
    }
  })

  it('allows verified users', () => {
    const beforeLoad = Route.options.beforeLoad
    if (!beforeLoad) throw new Error('beforeLoad not defined')
    expect(() => {
      beforeLoad({ context: { session: { user: { id: 'u1', emailVerified: true } } }, location: { href: '/recipes/new' } } as never)
    }).not.toThrow()
  })
})
