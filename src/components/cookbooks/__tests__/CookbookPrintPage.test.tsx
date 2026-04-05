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
