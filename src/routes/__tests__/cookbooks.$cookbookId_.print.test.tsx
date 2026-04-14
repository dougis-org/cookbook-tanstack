import { render, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { mockUseParams, mockUseSearch } = vi.hoisted(() => ({
  mockUseParams: vi.fn(),
  mockUseSearch: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (opts: Record<string, unknown>) => ({
    ...opts,
    useParams: mockUseParams,
    useSearch: mockUseSearch,
  }),
  Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}))

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
      printById: {
        queryOptions: ({ id }: { id: string }) => ({
          queryKey: ['cookbooks', 'printById', id],
        }),
      },
    },
  },
}))

import { CookbookPrintPage } from '@/routes/cookbooks.$cookbookId_.print'

const printData = {
  name: 'Test Cookbook',
  description: null,
  chapters: [],
  recipes: [],
}

describe('CookbookPrintPage — document.title swap', () => {
  let originalTitle: string
  let titleAtPrint: string | undefined

  beforeEach(() => {
    originalTitle = document.title
    titleAtPrint = undefined

    mockUseParams.mockReturnValue({ cookbookId: 'cookbook-1' })
    mockUseSearch.mockReturnValue({})
    mockUseQuery.mockReturnValue({ data: printData, isLoading: false })

    vi.spyOn(window, 'print').mockImplementation(() => {
      titleAtPrint = document.title
    })
  })

  afterEach(() => {
    document.title = originalTitle
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  it('sets the cookbook name as document.title when window.print() is called', async () => {
    render(<CookbookPrintPage />)

    await waitFor(() => {
      expect(window.print).toHaveBeenCalled()
    })

    expect(titleAtPrint).toBe('Test Cookbook')
  })

  it('restores the original document.title immediately after window.print()', async () => {
    render(<CookbookPrintPage />)

    await waitFor(() => {
      expect(window.print).toHaveBeenCalled()
    })

    expect(document.title).toBe(originalTitle)
  })

  it('does not swap document.title or call window.print() when displayonly=1', () => {
    mockUseSearch.mockReturnValue({ displayonly: '1' })

    render(<CookbookPrintPage />)

    expect(window.print).not.toHaveBeenCalled()
    expect(document.title).toBe(originalTitle)
  })
})
