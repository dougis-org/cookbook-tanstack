import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

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

describe('CookbooksPage', () => {
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
})
