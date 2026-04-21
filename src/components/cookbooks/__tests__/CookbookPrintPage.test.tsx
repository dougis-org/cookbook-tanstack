import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@tanstack/react-router', async () => {
  const { createRouterMock } = await import('@/test-helpers/mocks')
  return createRouterMock({ params: { cookbookId: 'cb1' }, search: { displayonly: '1' } })
})

vi.mock('@/components/ui/Breadcrumb', () => ({ default: () => null }))
vi.mock('@/components/ui/PrintButton', () => ({ default: () => null }))
vi.mock('@/components/recipes/RecipeDetail', () => ({
  default: ({ recipe }: { recipe: { name: string } }) => <div>{recipe.name}</div>,
}))

const mockUseQuery = vi.fn()
vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}))

vi.mock('@/lib/trpc', () => ({
  trpc: {
    cookbooks: {
      printById: { queryOptions: ({ id }: { id: string }) => ({ queryKey: ['cookbooks', 'printById', id] }) },
    },
  },
}))

import { CookbookPrintPage } from '@/routes/cookbooks.$cookbookId_.print'

const baseData = {
  name: 'My Cookbook',
  description: null,
  chapters: [],
}

const threeRecipes = [
  { id: 'r1', name: 'Soup', prepTime: null, cookTime: null, orderIndex: 0 },
  { id: 'r2', name: 'Salad', prepTime: null, cookTime: null, orderIndex: 1 },
  { id: 'r3', name: 'Pasta', prepTime: null, cookTime: null, orderIndex: 2 },
]

const chapteredData = {
  ...baseData,
  chapters: [
    { id: 'c1', name: 'Breakfast', orderIndex: 0 },
    { id: 'c2', name: 'Dinner', orderIndex: 1 },
  ],
  recipes: [
    { id: 'r1', name: 'Uncategorized', prepTime: null, cookTime: null, orderIndex: 0, chapterId: null },
    { id: 'r2', name: 'Dinner Pasta', prepTime: null, cookTime: null, orderIndex: 1, chapterId: 'c2' },
    { id: 'r3', name: 'Breakfast Toast', prepTime: null, cookTime: null, orderIndex: 2, chapterId: 'c1' },
  ],
}

describe('CookbookPrintPage — alphabetical index', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders alphabetical index when recipes.length > 0', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      data: {
        ...baseData,
        recipes: [
          { id: 'r1', name: 'Zucchini Bread', prepTime: null, cookTime: null, orderIndex: 0 },
          { id: 'r2', name: 'Apple Pie', prepTime: null, cookTime: null, orderIndex: 1 },
        ],
      },
    })
    render(<CookbookPrintPage />)
    expect(screen.getByText('Alphabetical Index')).toBeInTheDocument()
  })

  it('does not render alphabetical index when recipes.length === 0', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      data: { ...baseData, recipes: [] },
    })
    render(<CookbookPrintPage />)
    expect(screen.queryByText('Alphabetical Index')).toBeNull()
  })
})

describe('CookbookPrintPage — #N position labels', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders one position label per recipe section', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      data: { ...baseData, recipes: threeRecipes },
    })
    const { container } = render(<CookbookPrintPage />)
    const labels = Array.from(
      container.querySelectorAll<HTMLElement>('.cookbook-recipe-position-label'),
    )

    expect(labels.map((label) => label.textContent)).toEqual(['#1', '#2', '#3'])
  })

  it('renders exactly 3 cookbook-recipe-section divs for 3 recipes', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      data: { ...baseData, recipes: threeRecipes },
    })
    const { container } = render(<CookbookPrintPage />)
    const sections = container.querySelectorAll('.cookbook-recipe-section')
    expect(sections).toHaveLength(3)
  })

  it('each recipe section contains its #N label', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      data: { ...baseData, recipes: threeRecipes },
    })
    const { container } = render(<CookbookPrintPage />)
    const sections = Array.from(container.querySelectorAll('.cookbook-recipe-section'))
    expect(sections[0]).toHaveTextContent('#1')
    expect(sections[1]).toHaveTextContent('#2')
    expect(sections[2]).toHaveTextContent('#3')
  })

  it('uses chapter display order for recipe sections and labels', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      data: chapteredData,
    })
    const { container } = render(<CookbookPrintPage />)
    const sections = Array.from(container.querySelectorAll<HTMLElement>('.cookbook-recipe-section'))
    const labels = Array.from(
      container.querySelectorAll<HTMLElement>('.cookbook-recipe-position-label'),
    )

    expect(labels.map((label) => label.textContent)).toEqual(['#1', '#2', '#3'])
    expect(sections[0]).toHaveTextContent('Breakfast Toast')
    expect(sections[0]).toHaveTextContent('#1')
    expect(sections[1]).toHaveTextContent('Dinner Pasta')
    expect(sections[1]).toHaveTextContent('#2')
    expect(sections[2]).toHaveTextContent('Uncategorized')
    expect(sections[2]).toHaveTextContent('#3')
  })

  it('renders no recipe sections and no #N labels for empty recipe list', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      data: { ...baseData, recipes: [] },
    })
    const { container } = render(<CookbookPrintPage />)
    expect(container.querySelectorAll('.cookbook-recipe-section')).toHaveLength(0)
    expect(screen.queryByText(/^#\d+$/)).toBeNull()
  })

  it('renders sequential #N labels inside recipe sections', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      data: { ...baseData, recipes: threeRecipes },
    })
    const { container } = render(<CookbookPrintPage />)
    const sections = Array.from(container.querySelectorAll('.cookbook-recipe-section'))
    // Each section's label text matches its 1-based position
    sections.forEach((section, i) => {
      expect(section).toHaveTextContent(`#${i + 1}`)
    })
  })
})
