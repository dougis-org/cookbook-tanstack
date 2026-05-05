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

vi.mock('@/components/cookbooks/CookbookCard', () => ({ default: () => null }))
vi.mock('@/components/cookbooks/CookbookFields', () => ({ default: () => null }))

const mockUseAuth = vi.fn()
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

const mockUseTierEntitlements = vi.fn()
vi.mock('@/hooks/useTierEntitlements', () => ({
  useTierEntitlements: () => mockUseTierEntitlements(),
}))

const mockUseQuery = vi.fn()
vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}))

vi.mock('@/lib/trpc', () => {
  const empty = (opts?: unknown) => ({ queryKey: ['empty', opts] })
  return {
    trpc: {
      cookbooks: {
        list: { queryOptions: empty },
      },
      usage: {
        getOwned: { queryOptions: empty },
      },
    },
  }
})

import { CookbooksPage } from '@/routes/cookbooks/index'

const HOME_COOK_ENTITLEMENTS = { tier: 'home-cook', canCreatePrivate: false, canImport: false, recipeLimit: 10, cookbookLimit: 1 }

function setLoggedIn(opts: { emailVerified?: boolean; isLoggedIn?: boolean } = {}) {
  const isLoggedIn = opts.isLoggedIn ?? true
  mockUseAuth.mockReturnValue({
    session: isLoggedIn ? { user: { id: 'u1', emailVerified: opts.emailVerified ?? true } } : null,
    isPending: false,
    isLoggedIn,
    userId: isLoggedIn ? 'u1' : null,
  })
}

function setMockData() {
  mockUseQuery.mockReturnValue({ data: [], isLoading: false })
  mockUseTierEntitlements.mockReturnValue(HOME_COOK_ENTITLEMENTS)
}

describe('CookbooksPage — verification gate', () => {
  it('shows Verify Email CTA when unverified', () => {
    setLoggedIn({ emailVerified: false })
    setMockData()

    render(<CookbooksPage />)

    expect(screen.getByRole('link', { name: /verify email to get started/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /create your first cookbook/i })).not.toBeInTheDocument()
  })

  it('shows Create Cookbook button when verified', () => {
    setLoggedIn({ emailVerified: true })
    setMockData()

    render(<CookbooksPage />)

    expect(screen.getByRole('button', { name: /create your first cookbook/i })).toBeInTheDocument()
  })
})
