import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (opts: Record<string, unknown>) => ({
    ...opts,
    useParams: () => ({ cookbookId: 'cb1' }),
    useSearch: () => ({ displayonly: '1' }),
  }),
  Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}))

vi.mock('@/components/ui/Breadcrumb', () => ({ default: () => null }))
vi.mock('@/components/ui/PrintButton', () => ({ default: () => null }))
vi.mock('@/components/recipes/RecipeDetail', () => ({ default: () => null }))

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

  it('renders #1, #2, #3 labels for 3 recipes', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      data: { ...baseData, recipes: threeRecipes },
    })
    render(<CookbookPrintPage />)
    // Labels appear in both recipe sections AND alphabetical index — use getAllByText
    expect(screen.getAllByText('#1').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('#2').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('#3').length).toBeGreaterThanOrEqual(1)
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

  it('renders no recipe sections and no #N labels for empty recipe list', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      data: { ...baseData, recipes: [] },
    })
    const { container } = render(<CookbookPrintPage />)
    expect(container.querySelectorAll('.cookbook-recipe-section')).toHaveLength(0)
    expect(screen.queryByText(/^#\d+$/)).toBeNull()
  })

  it('#N labels in recipe sections match those in the TOC', () => {
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
