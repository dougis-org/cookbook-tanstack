import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@tanstack/react-router', async () => {
  const { createRouterMock } = await import('@/test-helpers/mocks')
  return createRouterMock({ search: {} })
})

vi.mock('@/components/layout/PageLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

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

import { AccountPage } from '@/routes/account'

function tierSession(tier: string) {
  return { session: { user: { id: 'u1', tier, isAdmin: false } }, isLoggedIn: true }
}

function usageData(recipeCount: number, cookbookCount: number) {
  return { data: { recipeCount, cookbookCount }, isLoading: false, isError: false }
}

describe('/account — tier section', () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue(usageData(0, 0))
  })

  it('renders tier name "Home Cook" for home-cook session', () => {
    mockUseAuth.mockReturnValue(tierSession('home-cook'))
    render(<AccountPage />)
    expect(screen.getByText(/home cook/i)).toBeInTheDocument()
  })

  it('renders tier description for home-cook session', () => {
    mockUseAuth.mockReturnValue(tierSession('home-cook'))
    render(<AccountPage />)
    const desc = screen.getByTestId('tier-description')
    expect(desc.textContent!.length).toBeGreaterThan(0)
  })

  it('shows recipe progress "7 of 10" for home-cook with 7 recipes', () => {
    mockUseAuth.mockReturnValue(tierSession('home-cook'))
    mockUseQuery.mockReturnValue(usageData(7, 0))
    render(<AccountPage />)
    expect(screen.getByText(/7 of 10/i)).toBeInTheDocument()
  })

  it('shows cookbook progress "1 of 1" for home-cook with 1 cookbook', () => {
    mockUseAuth.mockReturnValue(tierSession('home-cook'))
    mockUseQuery.mockReturnValue(usageData(0, 1))
    render(<AccountPage />)
    expect(screen.getByText(/1 of 1/i)).toBeInTheDocument()
  })

  it('shows next-tier preview (Prep Cook) for home-cook', () => {
    mockUseAuth.mockReturnValue(tierSession('home-cook'))
    render(<AccountPage />)
    expect(screen.getByTestId('next-tier-preview')).toBeInTheDocument()
    expect(screen.getByTestId('next-tier-preview').textContent).toContain('Prep Cook')
  })

  it('shows next-tier preview (Executive Chef) for sous-chef', () => {
    mockUseAuth.mockReturnValue(tierSession('sous-chef'))
    render(<AccountPage />)
    expect(screen.getByTestId('next-tier-preview')).toBeInTheDocument()
    expect(screen.getByTestId('next-tier-preview').textContent).toContain('Executive Chef')
  })

  it('shows no next-tier preview for executive-chef', () => {
    mockUseAuth.mockReturnValue(tierSession('executive-chef'))
    render(<AccountPage />)
    expect(screen.queryByTestId('next-tier-preview')).not.toBeInTheDocument()
  })

  it('renders a link to /pricing', () => {
    mockUseAuth.mockReturnValue(tierSession('home-cook'))
    render(<AccountPage />)
    const pricingLink = screen.getByRole('link', { name: /pricing/i })
    expect(pricingLink).toBeInTheDocument()
    expect(pricingLink.getAttribute('href')).toBe('/pricing')
  })

  it('does not render "coming soon" stub text', () => {
    mockUseAuth.mockReturnValue(tierSession('home-cook'))
    render(<AccountPage />)
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument()
  })

  it('shows loading state while usage.getOwned is pending', () => {
    mockUseAuth.mockReturnValue(tierSession('home-cook'))
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    render(<AccountPage />)
    expect(screen.getByTestId('usage-loading')).toBeInTheDocument()
  })

  it('shows error message when usage.getOwned fails without crashing', () => {
    mockUseAuth.mockReturnValue(tierSession('home-cook'))
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, isError: true })
    expect(() => render(<AccountPage />)).not.toThrow()
    expect(screen.getByTestId('usage-error')).toBeInTheDocument()
  })

  it('sources recipe limit from TIER_LIMITS not hardcoded value', () => {
    mockUseAuth.mockReturnValue(tierSession('sous-chef'))
    mockUseQuery.mockReturnValue(usageData(250, 10))
    render(<AccountPage />)
    // sous-chef recipe limit is 500, cookbook limit is 25
    expect(screen.getByText(/250 of 500/i)).toBeInTheDocument()
    expect(screen.getByText(/10 of 25/i)).toBeInTheDocument()
  })
})
