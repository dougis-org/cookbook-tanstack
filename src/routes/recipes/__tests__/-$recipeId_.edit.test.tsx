import { describe, it, expect, vi } from 'vitest'

vi.mock('@tanstack/react-router', async () => {
  const { createRouterMock } = await import('@/test-helpers/mocks')
  return createRouterMock({ params: { recipeId: 'r1' } })
})

vi.mock('@/components/layout/PageLayout', () => ({ default: () => null }))
vi.mock('@/components/recipes/RecipeForm', () => ({ default: () => null }))
vi.mock('@/components/ui/Breadcrumb', () => ({ default: () => null }))
vi.mock('@tanstack/react-query', () => ({ useQuery: () => ({ data: null, isLoading: false }) }))
vi.mock('@/lib/trpc', () => ({ trpc: { recipes: { byId: { queryOptions: () => ({}) } } } }))

import { Route } from '@/routes/recipes/$recipeId_.edit'

describe('/recipes/$recipeId/edit — beforeLoad', () => {
  it('redirects unauthenticated visitors to /auth/login', () => {
    const beforeLoad = Route.options.beforeLoad
    if (!beforeLoad) throw new Error('beforeLoad not defined')
    try {
      beforeLoad({ context: { session: null }, location: { href: '/recipes/r1/edit' } } as never)
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
      beforeLoad({ context: { session: { user: { id: 'u1', emailVerified: false } } }, location: { href: '/recipes/r1/edit' } } as never)
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
      beforeLoad({ context: { session: { user: { id: 'u1', emailVerified: true } } }, location: { href: '/recipes/r1/edit' } } as never)
    }).not.toThrow()
  })
})
