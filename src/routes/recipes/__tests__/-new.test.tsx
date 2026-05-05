import { describe, it, vi } from 'vitest'
import { testVerifiedAuthGuard } from '@/test-helpers/auth-guard'

vi.mock('@tanstack/react-router', async () => {
  const { createRouterMock } = await import('@/test-helpers/mocks')
  return createRouterMock()
})

vi.mock('@/components/layout/PageLayout', () => ({ default: () => null }))
vi.mock('@/components/recipes/RecipeForm', () => ({ default: () => null }))

import { Route } from '@/routes/recipes/new'

describe('/recipes/new — beforeLoad', () => {
  it('enforces verified authentication', () => {
    const beforeLoad = Route.options.beforeLoad
    if (!beforeLoad) throw new Error('beforeLoad not defined')
    testVerifiedAuthGuard(beforeLoad, '/recipes/new')
  })
})
