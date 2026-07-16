import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@tanstack/react-router', async () => {
  const { createRouterMock } = await import('@/test-helpers/mocks')
  return createRouterMock({ params: { recipeId: 'r1' } })
})

vi.mock('@/components/layout/PageLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/recipes/RecipeDetail', () => ({
  default: () => <div>recipe-detail</div>,
}))
vi.mock('@/components/recipes/RelatedRecipesSection', () => ({ default: () => null }))
vi.mock('@/components/recipes/DeleteConfirmModal', () => ({ default: () => null }))
vi.mock('@/components/recipes/ExportButton', () => ({ default: () => null }))
vi.mock('@/components/recipes/RecipeNotesUpgradeNudge', () => ({ default: () => null }))
vi.mock('@/components/ui/Breadcrumb', () => ({ default: () => null }))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ isLoggedIn: true, userId: 'user1', isPending: false, session: { user: { id: 'user1', tier: 'sous-chef' } } }),
}))
vi.mock('@/hooks/useTierEntitlements', () => ({
  useTierEntitlements: () => ({ canUsePrivateRecipeNotes: true }),
}))

const mockGetNote = vi.fn(() => ({ hasNote: true, note: { body: 'My saved note', updatedAt: new Date() } }))
const mockGetRecipe = vi.fn(() => ({
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
}))

vi.mock('@/lib/trpc', () => ({
  trpc: {
    recipes: {
      byId: {
        queryOptions: ({ id }: { id: string }) => ({
          queryKey: ['recipes', 'byId', id],
          queryFn: () => mockGetRecipe(),
        }),
      },
      toggleMarked: { mutationOptions: (opts?: Record<string, unknown>) => ({ mutationFn: () => {}, ...opts }) },
      delete: { mutationOptions: (opts?: Record<string, unknown>) => ({ mutationFn: () => {}, ...opts }) },
    },
    privateRecipeNotes: {
      get: {
        queryOptions: ({ recipeId }: { recipeId: string }) => ({
          queryKey: ['privateRecipeNotes', 'get', recipeId],
          queryFn: () => mockGetNote(),
        }),
      },
      upsert: { mutationOptions: (opts?: Record<string, unknown>) => ({ mutationFn: () => {}, ...opts }) },
    },
  },
}))

import { RecipeDetailPage } from '@/routes/recipes/$recipeId'

let queryClient: QueryClient

function wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('RecipeDetailPage private note query dedup', () => {
  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    mockGetNote.mockClear()
  })

  it('fires exactly one network request for trpc.privateRecipeNotes.get even though the route and PrivateRecipeNotes both call useQuery for it', async () => {
    render(<RecipeDetailPage />, { wrapper })

    await waitFor(() => expect(mockGetNote).toHaveBeenCalledTimes(1))
    // Let any queued microtasks/observers settle, then re-assert the count is
    // still exactly one — guards against a delayed second fetch (e.g. a
    // second query observer mounting slightly later) that a single
    // first-call-only assertion above wouldn't catch.
    await waitFor(() => expect(queryClient.isFetching()).toBe(0))
    expect(mockGetNote).toHaveBeenCalledTimes(1)
  })
})
