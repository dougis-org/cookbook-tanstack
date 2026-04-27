import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@tanstack/react-router', async () => {
  const { createRouterMock } = await import('@/test-helpers/mocks')
  return createRouterMock()
})

vi.mock('@/components/layout/PageLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/cookbooks/CookbookCard', () => ({
  default: ({ cookbook }: { cookbook: { name: string } }) => <div>{cookbook.name}</div>,
}))

vi.mock('@/components/cookbooks/CookbookFields', () => ({
  default: () => null,
}))

const mockUseAuth = vi.fn()
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

const mockUseTierEntitlements = vi.fn()
vi.mock('@/hooks/useTierEntitlements', () => ({
  useTierEntitlements: () => mockUseTierEntitlements(),
}))

const mockUseQuery = vi.fn()
const mockUseMutation = vi.fn()
vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}))

vi.mock('@/lib/trpc', () => ({
  trpc: {
    cookbooks: {
      list: { queryOptions: () => ({ queryKey: ['cookbooks'] }) },
      create: { mutationOptions: (opts: unknown) => opts },
    },
  },
}))

import { CookbooksPage } from '@/routes/cookbooks/index'

function renderPage() {
  mockUseMutation.mockReturnValue({ mutate: vi.fn(), isPending: false })
  return render(<CookbooksPage />)
}

const defaultEntitlements = {
  tier: 'sous-chef',
  canCreatePrivate: true,
  canImport: true,
  recipeLimit: 500,
  cookbookLimit: 25,
}

const homeCookEntitlements = {
  tier: 'home-cook',
  canCreatePrivate: false,
  canImport: false,
  recipeLimit: 10,
  cookbookLimit: 1,
}

const oneCookbook = [{ id: '1', name: 'My Cookbook', description: null, isPublic: true, imageUrl: null, recipeCount: 0 }]

describe('CookbooksPage', () => {
  beforeEach(() => {
    mockUseTierEntitlements.mockReturnValue(defaultEntitlements)
  })

  describe('when logged out', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ session: null, isPending: false, isLoggedIn: false, userId: null })
    })

    it('hides the New Cookbook button', () => {
      mockUseQuery.mockReturnValue({ data: [{ id: '1', name: 'Test', description: null, isPublic: true, imageUrl: null, recipeCount: 0 }], isLoading: false })
      renderPage()
      expect(screen.queryByText('New Cookbook')).not.toBeInTheDocument()
    })

    it('hides the Create your first cookbook button in the empty state', () => {
      mockUseQuery.mockReturnValue({ data: [], isLoading: false })
      renderPage()
      expect(screen.queryByText('Create your first cookbook')).not.toBeInTheDocument()
    })

    it('still shows the cookbook list', () => {
      mockUseQuery.mockReturnValue({ data: [{ id: '1', name: 'My Cookbook', description: null, isPublic: true, imageUrl: null, recipeCount: 0 }], isLoading: false })
      renderPage()
      expect(screen.getByText('My Cookbook')).toBeInTheDocument()
    })
  })

  describe('when logged in', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        session: { user: { id: 'user-1', name: 'Test User', email: 'test@example.com' } },
        isPending: false,
        isLoggedIn: true,
        userId: 'user-1',
      })
    })

    it('shows the New Cookbook button', () => {
      mockUseQuery.mockReturnValue({ data: [{ id: '1', name: 'Test', description: null, isPublic: true, imageUrl: null, recipeCount: 0 }], isLoading: false })
      renderPage()
      expect(screen.getByText('New Cookbook')).toBeInTheDocument()
    })

    it('shows the Create your first cookbook button in the empty state', () => {
      mockUseQuery.mockReturnValue({ data: [], isLoading: false })
      renderPage()
      expect(screen.getByText('Create your first cookbook')).toBeInTheDocument()
    })
  })

  describe('tier affordances', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        session: { user: { id: 'user-1', tier: 'home-cook' } },
        isPending: false,
        isLoggedIn: true,
        userId: 'user-1',
      })
    })

    it('disables New Cookbook button when home-cook is at cookbook limit', () => {
      mockUseTierEntitlements.mockReturnValue(homeCookEntitlements)
      mockUseQuery.mockReturnValue({ data: oneCookbook, isLoading: false })
      renderPage()
      expect(screen.getByRole('button', { name: /new cookbook/i })).toBeDisabled()
    })

    it('shows inline TierWall when at cookbook limit', () => {
      mockUseTierEntitlements.mockReturnValue(homeCookEntitlements)
      mockUseQuery.mockReturnValue({ data: oneCookbook, isLoading: false })
      renderPage()
      expect(screen.getAllByText(/limit/i).length).toBeGreaterThan(0)
    })

    it('enables New Cookbook button when below limit', () => {
      mockUseTierEntitlements.mockReturnValue(homeCookEntitlements)
      mockUseQuery.mockReturnValue({ data: [], isLoading: false })
      renderPage()
      expect(screen.getByRole('button', { name: /new cookbook/i })).not.toBeDisabled()
    })

    it('shows TierWall modal when cookbook create returns a tier-wall error', async () => {
      mockUseTierEntitlements.mockReturnValue(defaultEntitlements)
      mockUseQuery.mockReturnValue({ data: [], isLoading: false })
      let capturedOnError: ((err: unknown) => void) | undefined
      renderPage()

      // Switch to implementation that captures onError before the form renders
      mockUseMutation.mockImplementation((opts: { onError?: (err: unknown) => void }) => {
        capturedOnError = opts?.onError
        return { mutate: vi.fn(), isPending: false }
      })

      fireEvent.click(screen.getByRole('button', { name: /new cookbook/i }))

      await waitFor(() => {
        expect(capturedOnError).toBeDefined()
      })

      capturedOnError!({ data: { appError: { type: 'tier-wall', reason: 'count-limit' } }, message: 'Limit reached' })

      await waitFor(() => {
        expect(screen.getByText('Plan limit reached')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /not now/i })).toBeInTheDocument()
      })
    })

    it('shows generic error (not TierWall) when cookbook create fails with a non-tier error', async () => {
      mockUseTierEntitlements.mockReturnValue(defaultEntitlements)
      mockUseQuery.mockReturnValue({ data: [], isLoading: false })
      let capturedOnError: ((err: unknown) => void) | undefined
      renderPage()

      mockUseMutation.mockImplementation((opts: { onError?: (err: unknown) => void }) => {
        capturedOnError = opts?.onError
        return { mutate: vi.fn(), isPending: false }
      })

      fireEvent.click(screen.getByRole('button', { name: /new cookbook/i }))

      await waitFor(() => {
        expect(capturedOnError).toBeDefined()
      })

      capturedOnError!({ message: 'Network failure' })

      await waitFor(() => {
        expect(screen.getByText('Network failure')).toBeInTheDocument()
      })
      expect(screen.queryByText('Plan limit reached')).not.toBeInTheDocument()
    })
  })
})
