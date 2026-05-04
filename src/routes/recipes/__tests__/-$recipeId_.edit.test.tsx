import { describe, it, expect, vi } from 'vitest'
import { testVerifiedAuthGuard } from '@/test-helpers/auth-guard'

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
  it('enforces verified authentication', () => {
    const beforeLoad = Route.options.beforeLoad
    if (!beforeLoad) throw new Error('beforeLoad not defined')
    testVerifiedAuthGuard(beforeLoad, '/recipes/r1/edit')
  })
})
