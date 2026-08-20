import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@tanstack/react-router', async () => {
  const { createRouterMock } = await import('@/test-helpers/mocks')
  return createRouterMock({ params: { recipeId: 'r1' } })
})

vi.mock('@/lib/google-adsense', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/google-adsense')>()
  return {
    ...actual,
    getGoogleAdSenseSlotId: () => '1234567890',
  }
})

vi.mock('@/components/recipes/RecipeDetail', () => ({
  default: () => <div>recipe detail</div>,
}))
vi.mock('@/components/recipes/RelatedRecipesSection', () => ({ default: () => null }))
vi.mock('@/components/recipes/DeleteConfirmModal', () => ({ default: () => null }))
vi.mock('@/components/recipes/ExportButton', () => ({ default: () => null }))
vi.mock('@/components/recipes/PrivateRecipeNotes', () => ({ default: () => null }))
vi.mock('@/components/ui/Breadcrumb', () => ({ default: () => null }))

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
    recipes: {
      byId: { queryOptions: ({ id }: { id: string }) => ({ queryKey: ['recipes', 'byId', id] }) },
      isMarked: { queryOptions: ({ id }: { id: string }) => ({ queryKey: ['recipes', 'isMarked', id] }) },
      toggleMarked: { mutationOptions: (opts: unknown) => opts },
      delete: { mutationOptions: (opts: unknown) => opts },
    },
    privateRecipeNotes: {
      get: { queryOptions: ({ recipeId }: { recipeId: string }) => ({ queryKey: ['privateRecipeNotes', 'get', recipeId] }) },
    },
  },
}))

import { RecipeDetailPage } from '@/routes/recipes/$recipeId'

const baseRecipe = {
  id: 'r1',
  name: 'Test Recipe',
  userId: 'user1',
  marked: false,
  imageUrl: null,
  notes: null,
  prepTime: null,
  cookTime: null,
  servings: null,
  difficulty: null,
  classificationId: null,
  sourceId: null,
  mealIds: [],
  courseIds: [],
  preparationIds: [],
}

describe('RecipeDetailPage — ad slot rendering (real PageLayout/AdSlot)', () => {
  beforeEach(() => {
    mockUseMutation.mockReturnValue({ mutate: vi.fn(), isPending: false })
    mockUseTierEntitlements.mockReturnValue({ canUsePrivateRecipeNotes: true })
    mockUseQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
      if (Array.isArray(queryKey) && queryKey[0] === 'privateRecipeNotes') {
        return { data: { hasNote: false, note: null }, isLoading: false }
      }
      return { data: baseRecipe, isLoading: false }
    })
  })

  it('renders ad-eligible layout (right rail) for an anonymous visitor', () => {
    mockUseAuth.mockReturnValue({ isLoggedIn: false, userId: undefined, isPending: false, session: null })

    render(<RecipeDetailPage />)

    expect(screen.getByTestId('right-rail')).toBeInTheDocument()
  })

  it('renders ad-eligible layout (right rail) for a logged-in home-cook (free tier) visitor', () => {
    mockUseAuth.mockReturnValue({
      isLoggedIn: true,
      userId: 'user2',
      isPending: false,
      session: { user: { id: 'user2', tier: 'home-cook', isAdmin: false } },
    })

    render(<RecipeDetailPage />)

    expect(screen.getByTestId('right-rail')).toBeInTheDocument()
  })

  it('suppresses ads for a paid-tier visitor', () => {
    mockUseAuth.mockReturnValue({
      isLoggedIn: true,
      userId: 'user2',
      isPending: false,
      session: { user: { id: 'user2', tier: 'prep-cook', isAdmin: false } },
    })

    render(<RecipeDetailPage />)

    expect(screen.queryByTestId('right-rail')).toBeNull()
  })

  it('suppresses ads for an admin visitor regardless of tier', () => {
    mockUseAuth.mockReturnValue({
      isLoggedIn: true,
      userId: 'user2',
      isPending: false,
      session: { user: { id: 'user2', tier: 'home-cook', isAdmin: true } },
    })

    render(<RecipeDetailPage />)

    expect(screen.queryByTestId('right-rail')).toBeNull()
  })
})
