import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@tanstack/react-router', async () => {
  const { createRouterMock } = await import('@/test-helpers/mocks')
  return createRouterMock({ params: { recipeId: 'r1' } })
})

vi.mock('@/components/layout/PageLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/recipes/RecipeDetail', () => ({ default: () => null }))
vi.mock('@/components/recipes/RelatedRecipesSection', () => ({ default: () => null }))
vi.mock('@/components/recipes/DeleteConfirmModal', () => ({ default: () => null }))
vi.mock('@/components/recipes/ExportButton', () => ({ default: () => null }))
vi.mock('@/components/ui/Breadcrumb', () => ({ default: () => null }))

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
    recipes: {
      byId: { queryOptions: ({ id }: { id: string }) => ({ queryKey: ['recipes', 'byId', id] }) },
      isMarked: { queryOptions: ({ id }: { id: string }) => ({ queryKey: ['recipes', 'isMarked', id] }) },
      toggleMarked: { mutationOptions: (opts: unknown) => opts },
      delete: { mutationOptions: (opts: unknown) => opts },
    },
  },
}))

import { RecipeDetailPage } from '@/routes/recipes/$recipeId'

const baseRecipe = {
  id: 'r1',
  name: 'Test Recipe',
  userId: 'user1',
  marked: true,
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

describe('RecipeDetailPage', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ isLoggedIn: true, userId: 'user1', isPending: false, session: { user: { id: 'user1' } } })
    mockUseMutation.mockReturnValue({ mutate: vi.fn(), isPending: false })
  })

  it('derives Save/Saved button state from recipe.marked, not a separate isMarked query', () => {
    // byId returns marked: true; isMarked (if still called) returns marked: false
    // After fix: button shows "Saved" (reads recipe.marked = true)
    // Before fix: button shows "Save" (reads markedData.marked = false)
    mockUseQuery.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
      if (Array.isArray(queryKey) && queryKey[1] === 'isMarked') {
        return { data: { marked: false } }
      }
      return { data: { ...baseRecipe, marked: true }, isLoading: false }
    })

    render(<RecipeDetailPage />)

    expect(screen.getByRole('button', { name: /saved/i })).toBeInTheDocument()
  })
})
