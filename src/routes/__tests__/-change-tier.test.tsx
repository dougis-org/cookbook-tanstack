import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { testVerifiedAuthGuard } from '@/test-helpers/auth-guard'

vi.mock('@tanstack/react-router', async () => {
  const { createRouterMock } = await import('@/test-helpers/mocks')
  return createRouterMock()
})

vi.mock('@/components/layout/PageLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

import { Route, ChangeTierPage } from '@/routes/change-tier'

describe('/change-tier — beforeLoad', () => {
  it('enforces verified authentication', () => {
    const beforeLoad = Route.options.beforeLoad
    if (!beforeLoad) throw new Error('beforeLoad not defined')
    testVerifiedAuthGuard(beforeLoad, '/change-tier')
  })
})

describe('/change-tier', () => {
  it('renders the coming soon heading', () => {
    render(<ChangeTierPage />)
    expect(screen.getByText(/plan changes coming soon/i)).toBeInTheDocument()
  })

  it('renders a back link to /pricing', () => {
    render(<ChangeTierPage />)
    const link = screen.getByRole('link', { name: /view pricing/i })
    expect(link).toBeInTheDocument()
    expect(link.getAttribute('href')).toBe('/pricing')
  })
})
