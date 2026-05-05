import { describe, it, expect, vi } from 'vitest'
import { testVerifiedAuthGuard } from '@/test-helpers/auth-guard'

vi.mock('@tanstack/react-router', async () => {
  const { createRouterMock } = await import('@/test-helpers/mocks')
  return createRouterMock()
})

vi.mock('@/components/layout/PageLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/recipes/ImportDropzone', () => ({ default: () => null }))
vi.mock('@/components/recipes/ImportPreviewModal', () => ({ default: () => null }))

import { Route } from '@/routes/import/index'

describe('/import — beforeLoad', () => {
  it('enforces verified authentication', () => {
    const beforeLoad = Route.options.beforeLoad
    if (!beforeLoad) throw new Error('beforeLoad not defined')
    testVerifiedAuthGuard(beforeLoad, '/import')
  })
})
