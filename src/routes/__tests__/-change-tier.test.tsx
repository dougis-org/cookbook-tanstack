import { describe, it, expect, vi } from 'vitest'
import { testVerifiedAuthGuard } from '@/test-helpers/auth-guard'

vi.mock('@tanstack/react-router', async () => {
  const { createRouterMock } = await import('@/test-helpers/mocks')
  return createRouterMock()
})

vi.mock('@/components/layout/PageLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

import { Route } from '@/routes/change-tier'

describe('/change-tier — beforeLoad', () => {
  it('enforces verified authentication', () => {
    const beforeLoad = Route.options.beforeLoad
    if (!beforeLoad) throw new Error('beforeLoad not defined')
    testVerifiedAuthGuard(beforeLoad, '/change-tier')
  })
})
