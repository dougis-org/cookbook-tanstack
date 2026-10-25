import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, within } from '@testing-library/react'

// Composition test: real RecipeDetail inside the cookbook print route, so the
// footer row (footer items on the left, `#N` printFooter on the right) is
// exercised end to end. Other cookbook print tests mock RecipeDetail.

vi.mock('@tanstack/react-router', async () => {
  const { createRouterMock } = await import('@/test-helpers/mocks')
  return createRouterMock({ params: { cookbookId: 'cb1' }, search: { displayonly: '1' } })
})

vi.mock('@/components/ui/Breadcrumb', () => ({ default: () => null }))
vi.mock('@/components/ui/PrintButton', () => ({ default: () => null }))

type MockAuthState = {
  session: { user: Record<string, unknown> } | null
  isPending: boolean
  isLoggedIn: boolean
  userId: string | null
}
const mockUseAuth = vi.fn<() => MockAuthState>()
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => mockUseAuth() }))

const mockUseQuery = vi.fn()
vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}))

vi.mock('@/lib/trpc', () => ({
  trpc: {
    cookbooks: {
      printById: {
        queryOptions: ({ id }: { id: string }) => ({ queryKey: ['cookbooks', 'printById', id] }),
      },
    },
  },
}))

import { CookbookPrintPage } from '@/routes/cookbooks.$cookbookId_.print'

function makeRecipe(id: string, index: number, overrides: Record<string, unknown> = {}) {
  return {
    id,
    userId: 'u1',
    name: `Recipe ${index + 1}`,
    ingredients: 'Flour',
    instructions: 'Mix',
    notes: null,
    servings: 4,
    prepTime: 15,
    cookTime: 30,
    difficulty: 'medium',
    classificationName: 'Soups',
    orderIndex: index,
    chapterId: null,
    ...overrides,
  }
}

const printData = (recipes: ReturnType<typeof makeRecipe>[]) => ({
  name: 'My Cookbook',
  description: null,
  chapters: [],
  recipes,
})

function signedInWith(user: Record<string, unknown>) {
  mockUseAuth.mockReturnValue({
    session: { user: { id: 'u1', ...user } },
    isPending: false,
    isLoggedIn: true,
    userId: 'u1',
  })
}

describe('CookbookPrintPage — footer row composition with the real RecipeDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ session: null, isPending: false, isLoggedIn: false, userId: null })
  })

  it('puts footer items and #N in a single footer row', () => {
    signedInWith({ printCategory: 'footer', printServings: 'footer' })
    mockUseQuery.mockReturnValue({
      isLoading: false,
      data: printData([makeRecipe('r1', 0)]),
    })
    const { container } = render(<CookbookPrintPage />)

    const rows = container.querySelectorAll<HTMLElement>('[data-testid="print-footer-row"]')
    expect(rows).toHaveLength(1)
    const row = within(rows[0])
    expect(row.getByTestId('print-footer-items')).toHaveTextContent('Serves: 4 · Soups')
    expect(row.getByTestId('cookbook-recipe-position-label')).toHaveTextContent('#1')
  })

  it('renders only #N in the footer row when every element is none', () => {
    signedInWith({
      printCategory: 'none',
      printDifficulty: 'none',
      printServings: 'none',
      printPrepTime: 'none',
      printCookTime: 'none',
    })
    mockUseQuery.mockReturnValue({
      isLoading: false,
      data: printData([makeRecipe('r1', 0)]),
    })
    const { container } = render(<CookbookPrintPage />)

    const row = container.querySelector<HTMLElement>('[data-testid="print-footer-row"]')
    expect(row).not.toBeNull()
    expect(within(row!).queryByTestId('print-footer-items')).toBeNull()
    expect(row).toHaveTextContent(/^#1$/)
  })

  it('renders exactly one footer row per recipe, each with its own #N', () => {
    signedInWith({ printCategory: 'footer' })
    mockUseQuery.mockReturnValue({
      isLoading: false,
      data: printData([makeRecipe('r1', 0), makeRecipe('r2', 1), makeRecipe('r3', 2)]),
    })
    const { container } = render(<CookbookPrintPage />)

    const sections = Array.from(container.querySelectorAll<HTMLElement>('.cookbook-recipe-section'))
    expect(sections).toHaveLength(3)
    sections.forEach((section, i) => {
      const rows = section.querySelectorAll('[data-testid="print-footer-row"]')
      expect(rows).toHaveLength(1)
      expect(rows[0]).toHaveTextContent(new RegExp(`#${i + 1}$`))
    })
    expect(container.querySelectorAll('[data-testid="print-footer-row"]')).toHaveLength(3)
  })

  it('keeps header items out of the footer row', () => {
    signedInWith({ printCategory: 'footer', printPrepTime: 'header' })
    mockUseQuery.mockReturnValue({
      isLoading: false,
      data: printData([makeRecipe('r1', 0)]),
    })
    const { container } = render(<CookbookPrintPage />)

    expect(container.querySelector('[data-testid="print-meta-line"]')).toHaveTextContent('Prep: 15m')
    expect(container.querySelector('[data-testid="print-footer-row"]')).not.toHaveTextContent('Prep:')
  })
})
