import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@tanstack/react-router', async () => {
  const { createRouterMock } = await import('@/test-helpers/mocks')
  return createRouterMock({ params: { recipeId: 'r1' } })
})

vi.mock('@/components/layout/PageLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/recipes/RecipeDetail', () => ({
  default: ({ actions, personalNote }: RecipeDetailProps) => (
    <div>
      {actions}
      <div data-testid="personal-note">{personalNote ?? 'null'}</div>
    </div>
  ),
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
import type { RecipeDetailProps } from '@/components/recipes/RecipeDetail'

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
    mockUseTierEntitlements.mockReturnValue({ canUsePrivateRecipeNotes: true })
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

  it('renders the ShareButton and PrintButton next to each other in the actions slot', () => {
    mockUseQuery.mockReturnValue({ data: baseRecipe, isLoading: false })

    render(<RecipeDetailPage />)

    const shareButton = screen.getByRole('button', { name: /share/i })
    const printButton = screen.getByRole('button', { name: /print/i })

    expect(shareButton).toBeInTheDocument()
    expect(printButton).toBeInTheDocument()
    expect(shareButton.nextElementSibling).toBe(printButton)
  })
})

describe('RecipeDetailPage personalNoteBody gating', () => {
  const queryMock = (noteBody: string | null | undefined) =>
    ({ queryKey }: { queryKey: unknown[] }) => {
      if (Array.isArray(queryKey) && queryKey[0] === 'privateRecipeNotes') {
        return {
          data: noteBody == null ? { hasNote: false, note: null } : { hasNote: true, note: { body: noteBody, updatedAt: new Date() } },
          isLoading: false,
        }
      }
      return { data: baseRecipe, isLoading: false }
    }

  beforeEach(() => {
    mockUseMutation.mockReturnValue({ mutate: vi.fn(), isPending: false })
  })

  it('passes null to RecipeDetail for an anonymous viewer', () => {
    mockUseAuth.mockReturnValue({ isLoggedIn: false, userId: undefined, isPending: false, session: undefined })
    mockUseTierEntitlements.mockReturnValue({ canUsePrivateRecipeNotes: true })
    mockUseQuery.mockImplementation(queryMock('My saved note'))

    render(<RecipeDetailPage />)

    expect(screen.getByTestId('personal-note')).toHaveTextContent('null')
  })

  it('passes null for a logged-in user below the required tier, regardless of a stored note', () => {
    mockUseAuth.mockReturnValue({ isLoggedIn: true, userId: 'user1', isPending: false, session: { user: { id: 'user1' } } })
    mockUseTierEntitlements.mockReturnValue({ canUsePrivateRecipeNotes: false })
    mockUseQuery.mockImplementation(queryMock('My saved note'))

    render(<RecipeDetailPage />)

    expect(screen.getByTestId('personal-note')).toHaveTextContent('null')
  })

  it('passes null for an entitled user with no saved note', () => {
    mockUseAuth.mockReturnValue({ isLoggedIn: true, userId: 'user1', isPending: false, session: { user: { id: 'user1' } } })
    mockUseTierEntitlements.mockReturnValue({ canUsePrivateRecipeNotes: true })
    mockUseQuery.mockImplementation(queryMock(null))

    render(<RecipeDetailPage />)

    expect(screen.getByTestId('personal-note')).toHaveTextContent('null')
  })

  it('passes null for an entitled user whose saved note is whitespace-only', () => {
    mockUseAuth.mockReturnValue({ isLoggedIn: true, userId: 'user1', isPending: false, session: { user: { id: 'user1' } } })
    mockUseTierEntitlements.mockReturnValue({ canUsePrivateRecipeNotes: true })
    mockUseQuery.mockImplementation(queryMock('   \n  '))

    render(<RecipeDetailPage />)

    expect(screen.getByTestId('personal-note')).toHaveTextContent('null')
  })

  it('passes the trimmed note body for a logged-in, entitled user with a non-empty note', () => {
    mockUseAuth.mockReturnValue({ isLoggedIn: true, userId: 'user1', isPending: false, session: { user: { id: 'user1' } } })
    mockUseTierEntitlements.mockReturnValue({ canUsePrivateRecipeNotes: true })
    mockUseQuery.mockImplementation(queryMock('  My saved note  '))

    render(<RecipeDetailPage />)

    expect(screen.getByTestId('personal-note')).toHaveTextContent('My saved note')
  })
})
