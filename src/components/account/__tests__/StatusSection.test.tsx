import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@tanstack/react-router', async () => {
  const { createRouterMock } = await import('@/test-helpers/mocks')
  return createRouterMock({ search: {} })
})

const mockUseAuth = vi.fn()
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

const mockUseQuery = vi.fn()
vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}))

vi.mock('@/lib/trpc', () => ({
  trpc: {
    usage: {
      getOwned: {
        queryOptions: () => ({ queryKey: ['usage', 'getOwned'] }),
      },
    },
  },
}))

import StatusSection from '@/components/account/StatusSection'

function tierSession(tier: string | undefined) {
  return { session: { user: { id: 'u1', tier, isAdmin: false } } }
}

function usageData(recipeCount: number, cookbookCount: number) {
  return { data: { recipeCount, cookbookCount }, isLoading: false, isError: false }
}

describe('StatusSection — reason banner', () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue(usageData(0, 0))
    mockUseAuth.mockReturnValue(tierSession('home-cook'))
  })

  it('renders no banner when reason is undefined', () => {
    render(<StatusSection />)
    expect(screen.queryByText(/signed in|upgrade your plan/i)).not.toBeInTheDocument()
  })

  it('renders the auth-required message when reason is auth-required', () => {
    render(<StatusSection reason="auth-required" />)
    expect(screen.getByText('You need to be signed in to access that page.')).toBeInTheDocument()
  })

  it('renders the tier-limit-reached message when reason is tier-limit-reached', () => {
    render(<StatusSection reason="tier-limit-reached" />)
    expect(screen.getByText('Upgrade your plan to access this feature.')).toBeInTheDocument()
  })
})

describe('StatusSection — tier fallback', () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue(usageData(0, 0))
  })

  it('falls back to home-cook when session tier is unrecognized', () => {
    mockUseAuth.mockReturnValue(tierSession('not-a-real-tier'))
    render(<StatusSection />)
    expect(screen.getByText(/home cook/i)).toBeInTheDocument()
  })

  it('falls back to home-cook when session tier is missing', () => {
    mockUseAuth.mockReturnValue(tierSession(undefined))
    render(<StatusSection />)
    expect(screen.getByText(/home cook/i)).toBeInTheDocument()
  })
})
