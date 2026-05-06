import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const { mockUseSearch } = vi.hoisted(() => ({
  mockUseSearch: vi.fn().mockReturnValue({}),
}))

vi.mock('@tanstack/react-router', async () => {
  return {
    createFileRoute: (path: string) => (opts: any) => ({
      ...opts,
      useSearch: mockUseSearch,
    }),
  }
})

vi.mock('@/components/auth/AuthPageLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/auth/VerifyEmailPage', () => ({
  default: ({ from }: { from?: string }) => <div data-testid="verify-email-page">from: {from ?? 'none'}</div>,
}))

import { Route } from '@/routes/auth/verify-email'

describe('/auth/verify-email — wiring', () => {
  it('passes the from search param to the component', () => {
    mockUseSearch.mockReturnValue({ from: undefined })
    const Component = (Route as any).component as React.ComponentType
    render(<Component />)
    expect(screen.getByTestId('verify-email-page')).toHaveTextContent('from: none')
  })

  it('passes a custom from search param', () => {
    mockUseSearch.mockReturnValue({ from: '/recipes/new' })
    const Component = (Route as any).component as React.ComponentType
    render(<Component />)
    expect(screen.getByTestId('verify-email-page')).toHaveTextContent('from: /recipes/new')
  })
})
